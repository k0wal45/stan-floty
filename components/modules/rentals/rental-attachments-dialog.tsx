"use client";

import { useActionState, useEffect, useState } from "react";
import { uploadRentalAttachment, deleteRentalAttachment } from "@/server/actions/rentals";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Paperclip, Loader2 } from "lucide-react";
import type { RentalWithPaymentInfo } from "@/types/rentals";
import { Input } from "@/components/ui/input";

interface RentalAttachmentsDialogProps {
  rental: RentalWithPaymentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isImageUrl(url: string): boolean {
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
}

export function RentalAttachmentsDialog({ rental, open, onOpenChange }: RentalAttachmentsDialogProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      try {
        const result = await uploadRentalAttachment(rental.id, formData);
        return result;
      } catch {
        return { error: "Nie udało się przesłać pliku. Sprawdź rozmiar i typ pliku." };
      }
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Załącznik został dodany");
      const fileInput = document.getElementById(`upload-${rental.id}`) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  }, [state, rental.id]);

  const handleDelete = async (url: string) => {
    setIsDeleting(url);
    try {
      const result = await deleteRentalAttachment(rental.id, url);
      if (result.error) toast.error(result.error);
      else toast.success("Załącznik został usunięty");
    } catch {
      toast.error("Nie udało się usunąć załącznika. Spróbuj ponownie.");
    }
    setIsDeleting(null);
  };

  const attachments = rental.attachments || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Załączniki wypożyczenia</DialogTitle>
          <DialogDescription>
            Dodaj zdjęcia umowy, protokołu lub zniszczeń.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6">
          <form action={formAction} className="flex items-end gap-3 rounded-md border p-4 bg-muted/30">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`upload-${rental.id}`}>Wybierz plik</Label>
              <Input id={`upload-${rental.id}`} name="file" type="file" required accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" />
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP lub PDF · maks. 10 MB</p>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin size-4" /> : "Wyślij"}
            </Button>
          </form>

          <div className="flex flex-col gap-3">
            <h4 className="font-medium text-sm">Dodane pliki ({attachments.length})</h4>
            {attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Brak załączników.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2">
                {attachments.map((file) => (
                  <li key={file.url} className="group relative flex flex-col rounded-md border overflow-hidden bg-muted/20">
                    <a href={file.url} target="_blank" rel="noreferrer" className="block">
                      {isImageUrl(file.url) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full aspect-square object-cover bg-muted"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center bg-muted">
                          <Paperclip className="size-8 text-muted-foreground" />
                        </div>
                      )}
                    </a>
                    <div className="flex items-center justify-between gap-1 p-1.5">
                      <span className="text-xs truncate text-muted-foreground" title={file.name}>
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isDeleting === file.url}
                        onClick={() => handleDelete(file.url)}
                      >
                        {isDeleting === file.url ? <Loader2 className="animate-spin size-3" /> : <Trash2 className="size-3" />}
                        <span className="sr-only">Usuń</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}