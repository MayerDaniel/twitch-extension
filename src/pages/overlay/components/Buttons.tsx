import { useRef, useState, useEffect, RefObject } from 'react';
import Draggable from 'react-draggable';
import { classes } from "../../../utils/classes";
import { OverlayKey } from './overlay/Overlay';

// Update interface to receive card dimensions
interface ButtonsProps {
  options: Array<{
    key: string;
    icon: React.ComponentType<any>;
    title: string;
    type: "primary" | "secondary";
  }>;
  onClick: (key: OverlayKey, position?: {x: number, y: number}) => void;
  active: OverlayKey;
  cardDimensions: {[key: string]: {width: number, height: number}}; // New prop
}

export default function Buttons({ options, onClick, active, cardDimensions }: ButtonsProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const buttonRefs = useRef<{[key: string]: HTMLButtonElement | null}>({});
  const dragStarted = useRef(false);
  
  // Track position of the button container
  const handleDrag = (e: any, data: {x: number, y: number}) => {
    setPosition({ x: data.x, y: data.y });
    
    // Close any open cards if dragging
    if (active && !dragStarted.current) {
      onClick(""); // Close all cards
      dragStarted.current = true;
    }
  };
  
  // Reset drag state when drag stops
  const handleDragStop = () => {
    dragStarted.current = false;
  };

  // Use dynamic dimensions in handleButtonClick
  const handleButtonClick = (key: string) => {
    if (dragStarted.current) return;
    
    if (active === key) {
      onClick("");
      return;
    }
    
    // Get button element
    const buttonEl = buttonRefs.current[key];
    if (!buttonEl) return;
    
    // Get container
    const container = document.getElementById("overlay-container");
    if (!container) return;
    
    // Get actual card dimensions if available, otherwise use defaults
    const cardWidth = cardDimensions[key]?.width || 400;
    const cardHeight = cardDimensions[key]?.height || 300;
    
    // Use getBoundingClientRect for absolute positioning
    const buttonRect = buttonEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate positions in container coordinates
    let cardX, cardY;
    
    // Check if there's space on the right
    if (buttonRect.right + 40 + cardWidth <= containerRect.right) {
      // Position on right
      cardX = buttonRect.right + 40 - containerRect.left;
    } else {
      // Position on left - multiplying button width by 3 as requested
      cardX = buttonRect.left - buttonRect.width - cardWidth - containerRect.left;
    }
    
    // Y position (vertically centered)
    cardY = buttonRect.top + (buttonRect.height/2) - 150 - containerRect.top;
    
    // Ensure within bounds
    cardX = Math.max(20, cardX);
    cardY = Math.max(20, cardY);
    
    console.log(`Button: ${key}, Position: ${cardX},${cardY}`);
    
    onClick(key as OverlayKey, {x: cardX, y: cardY});
  };

  return (
    <Draggable
      nodeRef={nodeRef as RefObject<HTMLElement>}
      handle=".button-drag-handle"
      defaultPosition={position}
      position={position}
      onDrag={handleDrag}
      onStop={handleDragStop}
      bounds="#overlay-container"
    >
      <div 
        ref={nodeRef}
        className="absolute z-10 flex flex-col gap-2 p-2 rounded-lg bg-black/50"
      >
        <div className="button-drag-handle w-full h-4 cursor-move flex justify-center items-center">
          <span className="w-10 h-1 rounded-full bg-gray-500"></span>
        </div>
        
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = active === option.key;
          
          return (
            <button
              key={option.key}
              ref={el => { buttonRefs.current[option.key] = el; }}
              onClick={() => handleButtonClick(option.key)}
              className={classes(
                "relative rounded-md p-2 transition-colors",
                isActive
                  ? "bg-highlight text-black"
                  : "bg-black/40 text-white hover:bg-black/60",
                option.type === "primary" ? "text-xl" : "text-lg"
              )}
              title={option.title}
              aria-label={option.title}
              aria-pressed={isActive}
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </Draggable>
  );
}
