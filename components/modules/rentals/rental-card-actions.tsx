"use client";

import { useState } from "react";
import type { RentalWithPaymentInfo } from "@/types/rentals";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Paperclip,
} from "lucide-react";
import { EditRentalDialog } from "./edit-rental-dialog";
import { ExtendRentalDialog } from "./extend-rental-dialog";
import { CompleteRentalDialog } from "./complete-rental-dialog";
import { CancelRentalDialog } from "./cancel-rental-dialog";
import { RentalAttachmentsDialog } from "./rental-attachments-dialog";

export function RentalCardActions({
  rental,
}: {
  rental: RentalWithPaymentInfo;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const isActive = rental.status === "ACTIVE";

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {isActive ? (
          <>
            <div className="flex items-center gap-1.5 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Załączniki"
                className="flex-1 min-w-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAttachments(true)}
              >
                <Paperclip className="size-4" />
                <span className="truncate">Pliki</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Edytuj"
                className="flex-1 min-w-0"
                onClick={() => setShowEdit(true)}
              >
                <Pencil className="size-4" />
                <span className="truncate">Edytuj</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Anuluj wypożyczenie"
                className="flex-1 min-w-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowCancel(true)}
              >
                <XCircle className="size-4" />
                <span className="truncate">Anuluj</span>
              </Button>
            </div>

            <div className="flex items-center gap-1.5 w-full">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                title="Przedłuż wypożyczenie"
                className="flex-1 min-w-0"
                onClick={() => setShowExtend(true)}
              >
                <CalendarPlus className="size-4" />
                <span className="truncate">Przedłuż</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                title="Zakończ wypożyczenie"
                className="flex-1 min-w-0"
                onClick={() => setShowComplete(true)}
              >
                <CheckCircle2 className="size-4" />
                <span className="truncate">Zakończ</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-start w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              title="Załączniki"
              onClick={() => setShowAttachments(true)}
            >
              <Paperclip className="size-4" />
              Pliki ({rental.attachments?.length || 0})
            </Button>
          </div>
        )}
      </div>

      <EditRentalDialog
        rental={rental}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
      <ExtendRentalDialog
        rental={rental}
        open={showExtend}
        onOpenChange={setShowExtend}
      />
      <CompleteRentalDialog
        rental={rental}
        open={showComplete}
        onOpenChange={setShowComplete}
      />
      <CancelRentalDialog
        rental={rental}
        open={showCancel}
        onOpenChange={setShowCancel}
      />
      <RentalAttachmentsDialog
        rental={rental}
        open={showAttachments}
        onOpenChange={setShowAttachments}
      />
    </>
  );
}
