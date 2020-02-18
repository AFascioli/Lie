import { Component, Input, ElementRef, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-read-more',
  templateUrl: './read-more.component.html',
  styleUrls: ['./read-more.component.scss'],
})
export class ReadMoreComponent implements AfterViewInit {

    // the text that need to be put in the container
  @Input() text: string;

    // maximum height of the container
  @Input() maxHeight = 100;

  @Input() readAll: boolean;

    // set these to false to get the height of the expended container
  public isCollapsable = false;
  public isCollapsed = false;

  constructor(private elementRef: ElementRef,
              private cdRef: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.isCollapsed = false;
    this.isCollapsable = false;
    this.cdRef.detectChanges();
    this.detectChanges();
  }

  detectChanges() {
    if (!this.readAll) {
      const currentHeight = this.elementRef.nativeElement.getElementsByTagName('div')[0].offsetHeight - 1;
      if (currentHeight > this.maxHeight) {
        this.isCollapsed = true;
        this.isCollapsable = true;
        this.cdRef.detectChanges();
      }
    }
  }
}
