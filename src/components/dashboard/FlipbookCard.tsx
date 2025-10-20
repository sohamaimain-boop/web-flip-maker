import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Loader2, FileText } from "lucide-react";

interface Flipbook {
  id: string;
  title: string;
  status: string;
  thumbnail_path: string | null;
  created_at: string;
}

interface FlipbookCardProps {
  flipbook: Flipbook;
  onUpdate: () => void;
}

export const FlipbookCard = ({ flipbook }: FlipbookCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-[3/4] bg-muted flex items-center justify-center relative">
          {flipbook.status === "processing" ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </div>
          ) : flipbook.thumbnail_path && !imageError ? (
            <img
              src={flipbook.thumbnail_path}
              alt={flipbook.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <FileText className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <div className="w-full">
          <h3 className="font-semibold truncate">{flipbook.title}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(flipbook.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/flipbook/${flipbook.id}`)}
            disabled={flipbook.status !== "ready"}
          >
            <Eye className="mr-1 h-3 w-3" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/flipbook/${flipbook.id}/edit`)}
            disabled={flipbook.status !== "ready"}
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
