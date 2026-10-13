import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import App from "./App";

export default function AppWithScrollAnimation() {
  useScrollAnimation();
  return <App />;
}
