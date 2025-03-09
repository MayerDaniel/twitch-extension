import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
  type SetStateAction,
  type Dispatch,
  useLayoutEffect,
} from "react";

import Welcome from "../../../../components/Welcome";
import IconWelcome from "../../../../components/icons/IconWelcome";
import IconSettings from "../../../../components/icons/IconSettings";

import { classes } from "../../../../utils/classes";
import { visibleUnderCursor } from "../../../../utils/dom";

import useChatCommand from "../../../../hooks/useChatCommand";

import useSettings from "../../hooks/useSettings";
import useSleeping from "../../hooks/useSleeping";

import SettingsOverlay from "./Settings";

import Buttons from "../Buttons";

import Draggable from 'react-draggable';

// Show command-triggered popups for 10s
const commandTimeout = 10_000;

const overlayOptions = [
  {
    key: "welcome",
    type: "primary",
    icon: IconWelcome,
    title: "Options",
    component: (props: OverlayOptionProps) => (
      // Remove the Draggable wrapper and just render the Welcome component directly
      <Welcome 
        className={classes(props.className)}
      />
    ),
  },
  {
    key: "settings",
    type: "secondary",
    icon: IconSettings,
    title: "Extension Settings",
    component: SettingsOverlay,
  },
] as const;

export const isValidOverlayKey = (key: string) =>
  key === "" || overlayOptions.some((option) => option.key === key);

export type OverlayKey = (typeof overlayOptions)[number]["key"] | "";

export interface OverlayOptionProps {
  context: Record<string, never>; // Empty context since we removed ambassadors
  className?: string;
}

const hiddenClass =
  "invisible opacity-0 -translate-x-10 motion-reduce:translate-x-0";

export default function Overlay() {
  const settings = useSettings();
  const {
    sleeping,
    wake,
    on: addSleepListener,
    off: removeSleepListener,
  } = useSleeping();

  const [visibleOption, setVisibleOption] = useState<OverlayKey>(
    settings.openedMenu.value,
  );
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const awakingRef = useRef(false);

  // Add this state to track component positions
  const [componentPositions, setComponentPositions] = useState<{[key: string]: {x: number, y: number}}>({});

  // Use useRef to store measurements and useEffect to update state only once
  const [cardDimensions, setCardDimensions] = useState<{[key: string]: {width: number, height: number}}>({});
  const measuredCardsRef = useRef<Set<string>>(new Set());
  const cardRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // update setting when opened menu changes
  useEffect(() => {
    settings.openedMenu.change(visibleOption);
  }, [visibleOption]);

  // open saved (or default) menu when mounted
  useEffect(() => {
    setVisibleOption(settings.openedMenu.value);
  }, [settings.openedMenu.value]);

  // When a chat command is run, wake the overlay
  useChatCommand(
    useCallback(
      (command: string) => {
        if (!settings.disableChatPopup.value) {
          // Only respond to "welcome" command
          if (command !== "welcome") return;

          // Show the welcome card
          setVisibleOption("welcome");

          // Dismiss the overlay after a delay
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setVisibleOption("");
          }, commandTimeout);

          // Track that we're waking up, so that we don't immediately clear the timeout, and wake the overlay
          awakingRef.current = true;
          wake(commandTimeout);
        }
      },
      [settings.disableChatPopup.value, wake],
    ),
  );

  // Ensure we clean up the timer when we unmount
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  // If the user interacts with the overlay, clear the auto-dismiss timer
  // Except if we just triggered this wake, in which case we want to ignore it
  useEffect(() => {
    const callback = () => {
      if (awakingRef.current) awakingRef.current = false;
      else if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    addSleepListener("wake", callback);
    return () => removeSleepListener("wake", callback);
  }, [addSleepListener, removeSleepListener]);

  // Handle body clicks, dismissing the overlay if the user clicks outside of it
  const bodyClick = useCallback((e: MouseEvent) => {
    if (!visibleUnderCursor(e)) {
      setVisibleOption("");
    }
  }, []);

  // If the user clicks anywhere in the body, except the overlay itself, close the panels
  // Bind it during the capture phase so that we can process it before any other click handlers
  useEffect(() => {
    document.body.addEventListener("click", bodyClick, true);
    return () => document.body.removeEventListener("click", bodyClick, true);
  }, [bodyClick]);

  // Handle body double clicks, ignoring them inside of overlay elements
  const bodyDblClick = useCallback((e: MouseEvent) => {
    if (visibleUnderCursor(e)) {
      e.stopPropagation();
    }
  }, []);

  // If the user double clicks anywhere in the overlay itself, stop propagating the event
  // This stops double clicks from toggling fullscreen video which is the default behavior
  useEffect(() => {
    document.body.addEventListener("dblclick", bodyDblClick, true);
    return () =>
      document.body.removeEventListener("dblclick", bodyDblClick, true);
  }, [bodyDblClick]);

  // Generate empty context since we removed ambassadors
  const context = useMemo(() => ({}), []);

  // Update the setVisibleOption function
  const handleOptionClick = (key: OverlayKey, position?: {x: number, y: number}) => {
    setVisibleOption(key);
    if (position && key) {
      setComponentPositions(prev => ({ ...prev, [key]: position }));
    }
  };

  // Use useLayoutEffect to measure after DOM updates but before paint
  useLayoutEffect(() => {
    // Only measure cards that haven't been measured yet
    overlayOptions.forEach(option => {
      const key = option.key;
      if (
        visibleOption === key && 
        cardRefs.current[key] && 
        !measuredCardsRef.current.has(key)
      ) {
        const element = cardRefs.current[key];
        if (element) {
          const rect = element.getBoundingClientRect();
          setCardDimensions(prev => ({
            ...prev,
            [key]: { width: rect.width, height: rect.height }
          }));
          measuredCardsRef.current.add(key);
        }
      }
    });
  }, [visibleOption, overlayOptions]);

  return (
    <div
      className={classes(
        "flex h-full w-full transition-[opacity,visibility,transform,translate] will-change-[opacity,transform,translate]",
        sleeping &&
          !(
            process.env.NODE_ENV === "development" &&
            settings.disableOverlayHiding.value
          ) &&
          hiddenClass,
      )}
    >
      <Buttons
        options={[...overlayOptions]}
        onClick={handleOptionClick}
        active={visibleOption}
        cardDimensions={cardDimensions}
      />
      <div id="overlay-container" className="relative h-full w-full">
        {overlayOptions.map((option) => {
          const position = componentPositions[option.key] || {x: 20, y: 20};
          
          return (
            <div 
              key={option.key}
              ref={(el) => { cardRefs.current[option.key] = el; }}
              className={classes(
                "absolute transition-[opacity,visibility]",
                visibleOption !== option.key && hiddenClass
              )}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`
              }}
            >
              <option.component
                context={context}
                className={classes(
                  "transition-[opacity,visibility]",
                  visibleOption !== option.key && hiddenClass,
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
