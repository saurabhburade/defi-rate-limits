import { type RefObject, useEffect } from "react";

export const useOutsideClick = (ref: RefObject<HTMLElement | null>, callback: () => void) => {
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (event.target instanceof Element && ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [callback, ref]);
};
