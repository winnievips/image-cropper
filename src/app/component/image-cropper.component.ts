import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  isDevMode,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { DomSanitizer, SafeStyle, SafeUrl } from '@angular/platform-browser';
import SwiperCore, { SwiperOptions, Zoom } from 'swiper';
import { CropperPosition, Dimensions, ImageCroppedEvent, ImageTransform, LoadedImage, MoveStart } from '../interfaces';
import { OutputFormat } from '../interfaces/cropper-options.interface';
import { CropperSettings } from '../interfaces/cropper.settings';
import { MoveTypes } from '../interfaces/move-start.interface';
import { CropService } from '../services/crop.service';
import { CropperPositionService } from '../services/cropper-position.service';
import { LoadImageService } from '../services/load-image.service';
import { HammerStatic } from '../utils/hammer.utils';
import { getEventForKey, getInvertedPositionForKey, getPositionForKey } from '../utils/keyboard.utils';
SwiperCore.use([Zoom])

@Component({
  selector: 'image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCropperComponent implements OnChanges, OnInit, AfterViewInit {
  private settings = new CropperSettings();
  private loadedImage?: LoadedImage;

  safeImgDataUrl?: SafeUrl | string;
  safeTransformStyle?: SafeStyle | string;
  marginLeft: SafeStyle | string = '0px';
  maxSize: Dimensions = {
    width: 0,
    height: 0
  };
  moveTypes = MoveTypes;
  imageVisible = false;

  config: SwiperOptions = {
    zoom: {
      maxRatio: 5
    }
  }

  @ViewChild('wrapper', { static: true }) wrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('sourceImage', { static: false }) sourceImage!: ElementRef<HTMLDivElement>;
  @ViewChild('newSwiper') newSwiper: any;
  
  @Input() imageChangedEvent?: any;
  @Input() imageURL?: string;
  @Input() imageBase64?: string;
  @Input() imageFile?: File;

  @Input() format: OutputFormat = this.settings.format;
  @Input() transform: ImageTransform = {};
  @Input() maintainAspectRatio = this.settings.maintainAspectRatio;
  @Input() aspectRatio = this.settings.aspectRatio;
  @Input() resizeToWidth = this.settings.resizeToWidth;
  @Input() resizeToHeight = this.settings.resizeToHeight;
  @Input() cropperMinWidth = this.settings.cropperMinWidth;
  @Input() cropperMinHeight = this.settings.cropperMinHeight;
  @Input() cropperMaxHeight = this.settings.cropperMaxHeight;
  @Input() cropperMaxWidth = this.settings.cropperMaxWidth;
  @Input() cropperStaticWidth = this.settings.cropperStaticWidth;
  @Input() cropperStaticHeight = this.settings.cropperStaticHeight;
  @Input() canvasRotation = this.settings.canvasRotation;
  @Input() initialStepSize = this.settings.initialStepSize;
  @Input() roundCropper = this.settings.roundCropper;
  @Input() onlyScaleDown = this.settings.onlyScaleDown;
  @Input() imageQuality = this.settings.imageQuality;
  @Input() autoCrop = this.settings.autoCrop;
  @Input() backgroundColor = this.settings.backgroundColor;
  @Input() containWithinAspectRatio = this.settings.containWithinAspectRatio;
  @Input() hideResizeSquares = this.settings.hideResizeSquares;
  @Input() cropper: CropperPosition = {
    x1: -100,
    y1: -100,
    x2: 10000,
    y2: 10000
  };
  @HostBinding('style.text-align')
  @Input() alignImage: 'left' | 'center' = this.settings.alignImage;
  @HostBinding('class.disabled')
  @Input() disabled = true;

  @Output() imageCropped = new EventEmitter<ImageCroppedEvent>();
  @Output() startCropImage = new EventEmitter<void>();
  @Output() imageLoaded = new EventEmitter<LoadedImage>();
  @Output() cropperReady = new EventEmitter<Dimensions>();
  @Output() loadImageFailed = new EventEmitter<void>();

  constructor(
    private loadImageService: LoadImageService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef
  ) {
    this.reset();
  }

  ngAfterViewInit(): void {
    this.newSwiper?.swiperRef
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.onChangesUpdateSettings(changes);
    this.onChangesInputImage(changes);

    if (this.loadedImage?.original.image.complete && (changes['containWithinAspectRatio'] || changes['canvasRotation'])) {
      this.loadImageService
        .transformLoadedImage(this.loadedImage, this.settings)
        .then((res) => this.setLoadedImage(res))
    }
    if (changes['cropper'] || changes['maintainAspectRatio'] || changes['aspectRatio']) {
      this.setMaxSize();
      this.cd.markForCheck();
    }
    if (changes['transform']) {
      this.transform = this.transform || {};
      this.setCssTransform();
    }
  }

  private onChangesUpdateSettings(changes: SimpleChanges) {
    this.settings.setOptionsFromChanges(changes);

    if (this.settings.cropperStaticHeight && this.settings.cropperStaticWidth) {
      this.settings.setOptions({
        hideResizeSquares: true,
        cropperMinWidth: this.settings.cropperStaticWidth,
        cropperMinHeight: this.settings.cropperStaticHeight,
        cropperMaxHeight: this.settings.cropperStaticHeight,
        cropperMaxWidth: this.settings.cropperStaticWidth,
        maintainAspectRatio: false
      });
    }
  }

  private onChangesInputImage(changes: SimpleChanges): void {
    if (changes['imageChangedEvent'] || changes['imageURL'] || changes['imageBase64'] || changes['imageFile']) {
      this.reset();
    }
    if (changes['imageBase64'] && this.imageBase64) {
      this.loadBase64Image(this.imageBase64);
    }
  }

  private isValidImageChangedEvent(): boolean {
    return this.imageChangedEvent?.target?.files?.length > 0;
  }

  private setCssTransform() {
    this.safeTransformStyle = this.sanitizer.bypassSecurityTrustStyle(
      'scaleX(' + (this.transform.scale || 1) * (this.transform.flipH ? -1 : 1) + ')' +
      'scaleY(' + (this.transform.scale || 1) * (this.transform.flipV ? -1 : 1) + ')' +
      'rotate(' + (this.transform.rotate || 0) + 'deg)' +
      `translate(${this.transform.translateH || 0}%, ${this.transform.translateV || 0}%)`
    );
  }

  ngOnInit(): void {
    // this.settings.stepSize = this.initialStepSize;
    // this.activatePinchGesture();
    this.setMaxSize()
  }

  private reset(): void {
    this.imageVisible = false;
    this.loadedImage = undefined;
    this.safeImgDataUrl = 'data:image/png;base64,iVBORw0KGg'
      + 'oAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAU'
      + 'AAarVyFEAAAAASUVORK5CYII=';
    this.maxSize = {
      width: 0,
      height: 0
    };
    this.cropper.x1 = -100;
    this.cropper.y1 = -100;
    this.cropper.x2 = 10000;
    this.cropper.y2 = 10000;
  }

  private loadBase64Image(imageBase64: string): void {
    this.loadImageService
      .loadBase64Image(imageBase64, this.settings)
      .then((res) => this.setLoadedImage(res))
  }

  private setLoadedImage(loadedImage: LoadedImage): void {
    this.loadedImage = loadedImage;
    this.safeImgDataUrl = this.sanitizer.bypassSecurityTrustResourceUrl(loadedImage.transformed.base64);
    this.cd.markForCheck();
  }

  private setMaxSize(): void {
    if (this.sourceImage) {
      const sourceImageElement = this.sourceImage.nativeElement;
      this.maxSize.width = sourceImageElement.offsetWidth;
      this.maxSize.height = document.getElementsByTagName("ion-content")[0].clientHeight;
      this.marginLeft = this.sanitizer.bypassSecurityTrustStyle('calc(50% - ' + this.maxSize.width / 2 + 'px)');
    }
  }
}
