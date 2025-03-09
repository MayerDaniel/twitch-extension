import { useRef, useEffect } from "react";
import OptionsTable, { OptionsTableHandle } from "./OptionsTable";
import useTwitchAuth from "../hooks/useTwitchAuth";

interface WelcomeProps {
  className?: string;
}

export default function Welcome(props: WelcomeProps) {
  const { className } = props;
  const tableRef = useRef<OptionsTableHandle>(null);
  
  // Get Twitch auth data
  const auth = useTwitchAuth();
  
  // Log authentication status on component mount
  useEffect(() => {
    if (auth) {
      console.log("User is logged in with ID:", auth.userId);
      
      // You might want to add a row to your table with this info
      if (tableRef.current) {
        console.log(`Logged in: ${auth.userId}`);
      }
    } else {
      console.log("User is not logged in or auth not yet available");
      
      if (tableRef.current) {
        console.log("Not logged in");
      }
    }
  }, [auth]);
  
  // Add initial rows when component mounts
  const initialRows = [
    { name: "1" },
    { name: "2" },
    { name: "3" }
  ];

  return (
    <div>
      <OptionsTable 
        ref={tableRef}
        className={className}
        title="Welcome"
        initialRows={initialRows}
      />
    </div>
  );
}
