import { Link } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Offline() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-black text-foreground">You’re offline</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          CivicSync needs an internet connection to load the latest issues and maps. Please reconnect and try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button type="button" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

