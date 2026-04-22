import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { NewLanding } from "./NewLanding";

export const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return <NewLanding />;
};
