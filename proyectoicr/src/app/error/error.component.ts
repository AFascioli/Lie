import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "app-error",
  templateUrl: "./error.component.html",
  styleUrls: ["./error.component.css"],
})
export class ErrorComponent implements OnInit {
  dialog: MatDialogRef<ErrorComponent>;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { message: string; dialog: MatDialogRef<ErrorComponent> }
  ) {
    this.dialog = data.dialog;
  }

  close() {
    this.dialog.close();
  }

  ngOnInit() {}
}
