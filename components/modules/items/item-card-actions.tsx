"use client";

import { useState } from "react";
import { ItemRow } from "@/types/items";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EditItemDialog } from "./edit-item-dialog";
import { DeleteItemDialog } from "./delete-item-dialog";

export function ItemCardActions({ item }: { item: ItemRow }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          title="Edytuj"
          onClick={() => setShowEdit(true)}
        >
          <Pencil className="size-4" />
          <span className="sr-only">Edytuj</span>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          title="Usuń"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Usuń</span>
        </Button>
      </div>

      <EditItemDialog item={item} open={showEdit} onOpenChange={setShowEdit} />
      <DeleteItemDialog item={item} open={showDelete} onOpenChange={setShowDelete} />
    </>
  );
}