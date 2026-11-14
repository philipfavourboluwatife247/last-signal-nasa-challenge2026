import SpaceApp from "@/components/SpaceApp";
import { loadDossiers } from "@/lib/content";

export default function Home() {
  return <SpaceApp dossiers={loadDossiers()} />; // validated at build time
}
