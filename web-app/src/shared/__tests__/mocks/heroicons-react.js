// Mock for @heroicons/react/24/outline
const createMockIcon = (name) => {
  const MockIcon = ({ className, ...props }) => {
    return {
      type: 'svg',
      props: {
        className: `heroicon ${name.toLowerCase()} ${className || ''}`.trim(),
        'data-testid': `${name.toLowerCase()}-icon`,
        ...props
      }
    };
  };
  MockIcon.displayName = name;
  return MockIcon;
};

// Export all commonly used outline icons
export const MicrophoneIcon = createMockIcon('MicrophoneIcon');
export const StopIcon = createMockIcon('StopIcon');
export const SpeakerWaveIcon = createMockIcon('SpeakerWaveIcon');
export const ExclamationTriangleIcon = createMockIcon('ExclamationTriangleIcon');
export const XMarkIcon = createMockIcon('XMarkIcon');
export const CheckIcon = createMockIcon('CheckIcon');
export const ChevronDownIcon = createMockIcon('ChevronDownIcon');
export const ChevronUpIcon = createMockIcon('ChevronUpIcon');
export const ChevronLeftIcon = createMockIcon('ChevronLeftIcon');
export const ChevronRightIcon = createMockIcon('ChevronRightIcon');
export const PlusIcon = createMockIcon('PlusIcon');
export const MinusIcon = createMockIcon('MinusIcon');
export const PencilIcon = createMockIcon('PencilIcon');
export const TrashIcon = createMockIcon('TrashIcon');
export const EyeIcon = createMockIcon('EyeIcon');
export const EyeSlashIcon = createMockIcon('EyeSlashIcon');
export const DocumentIcon = createMockIcon('DocumentIcon');
export const FolderIcon = createMockIcon('FolderIcon');
export const HomeIcon = createMockIcon('HomeIcon');
export const UserIcon = createMockIcon('UserIcon');
export const CogIcon = createMockIcon('CogIcon');
export const BellIcon = createMockIcon('BellIcon');
export const EnvelopeIcon = createMockIcon('EnvelopeIcon');
export const PhoneIcon = createMockIcon('PhoneIcon');
export const CalendarIcon = createMockIcon('CalendarIcon');
export const ClockIcon = createMockIcon('ClockIcon');
export const MapPinIcon = createMockIcon('MapPinIcon');
export const GlobeAltIcon = createMockIcon('GlobeAltIcon');
export const LinkIcon = createMockIcon('LinkIcon');
export const ShareIcon = createMockIcon('ShareIcon');
export const DownloadIcon = createMockIcon('DownloadIcon');
export const UploadIcon = createMockIcon('UploadIcon');
export const PrinterIcon = createMockIcon('PrinterIcon');
export const MagnifyingGlassIcon = createMockIcon('MagnifyingGlassIcon');
export const FunnelIcon = createMockIcon('FunnelIcon');
export const AdjustmentsHorizontalIcon = createMockIcon('AdjustmentsHorizontalIcon');
export const Bars3Icon = createMockIcon('Bars3Icon');
export const XCircleIcon = createMockIcon('XCircleIcon');
export const CheckCircleIcon = createMockIcon('CheckCircleIcon');
export const ExclamationCircleIcon = createMockIcon('ExclamationCircleIcon');
export const InformationCircleIcon = createMockIcon('InformationCircleIcon');
export const QuestionMarkCircleIcon = createMockIcon('QuestionMarkCircleIcon');
export const HeartIcon = createMockIcon('HeartIcon');
export const StarIcon = createMockIcon('StarIcon');
export const BookmarkIcon = createMockIcon('BookmarkIcon');
export const TagIcon = createMockIcon('TagIcon');
export const FlagIcon = createMockIcon('FlagIcon');
export const ShieldCheckIcon = createMockIcon('ShieldCheckIcon');
export const LockClosedIcon = createMockIcon('LockClosedIcon');
export const LockOpenIcon = createMockIcon('LockOpenIcon');
export const KeyIcon = createMockIcon('KeyIcon');
export const CreditCardIcon = createMockIcon('CreditCardIcon');
export const BanknotesIcon = createMockIcon('BanknotesIcon');
export const CurrencyDollarIcon = createMockIcon('CurrencyDollarIcon');
export const ChartBarIcon = createMockIcon('ChartBarIcon');
export const ChartPieIcon = createMockIcon('ChartPieIcon');
export const ChartLineIcon = createMockIcon('ChartLineIcon');
export const PresentationChartBarIcon = createMockIcon('PresentationChartBarIcon');
export const TableCellsIcon = createMockIcon('TableCellsIcon');
export const ListBulletIcon = createMockIcon('ListBulletIcon');
export const Squares2X2Icon = createMockIcon('Squares2X2Icon');
export const ViewColumnsIcon = createMockIcon('ViewColumnsIcon');
export const PhotoIcon = createMockIcon('PhotoIcon');
export const CameraIcon = createMockIcon('CameraIcon');
export const VideoCameraIcon = createMockIcon('VideoCameraIcon');
export const PlayIcon = createMockIcon('PlayIcon');
export const PauseIcon = createMockIcon('PauseIcon');
export const ForwardIcon = createMockIcon('ForwardIcon');
export const BackwardIcon = createMockIcon('BackwardIcon');
export const SpeakerXMarkIcon = createMockIcon('SpeakerXMarkIcon');
export const MusicalNoteIcon = createMockIcon('MusicalNoteIcon');
export const RadioIcon = createMockIcon('RadioIcon');
export const TvIcon = createMockIcon('TvIcon');
export const ComputerDesktopIcon = createMockIcon('ComputerDesktopIcon');
export const DevicePhoneMobileIcon = createMockIcon('DevicePhoneMobileIcon');
export const DeviceTabletIcon = createMockIcon('DeviceTabletIcon');
export const WifiIcon = createMockIcon('WifiIcon');
export const SignalIcon = createMockIcon('SignalIcon');
export const BatteryIcon = createMockIcon('BatteryIcon');
export const PowerIcon = createMockIcon('PowerIcon');
export const CpuChipIcon = createMockIcon('CpuChipIcon');
export const ServerIcon = createMockIcon('ServerIcon');
export const CloudIcon = createMockIcon('CloudIcon');
export const CloudArrowUpIcon = createMockIcon('CloudArrowUpIcon');
export const CloudArrowDownIcon = createMockIcon('CloudArrowDownIcon');
export const InboxIcon = createMockIcon('InboxIcon');
export const InboxArrowDownIcon = createMockIcon('InboxArrowDownIcon');
export const ArchiveBoxIcon = createMockIcon('ArchiveBoxIcon');
export const ArchiveBoxArrowDownIcon = createMockIcon('ArchiveBoxArrowDownIcon');
export const DocumentTextIcon = createMockIcon('DocumentTextIcon');
export const DocumentArrowUpIcon = createMockIcon('DocumentArrowUpIcon');
export const DocumentArrowDownIcon = createMockIcon('DocumentArrowDownIcon');
export const DocumentDuplicateIcon = createMockIcon('DocumentDuplicateIcon');
export const DocumentPlusIcon = createMockIcon('DocumentPlusIcon');
export const DocumentMinusIcon = createMockIcon('DocumentMinusIcon');
export const ClipboardIcon = createMockIcon('ClipboardIcon');
export const ClipboardDocumentIcon = createMockIcon('ClipboardDocumentIcon');
export const ClipboardDocumentListIcon = createMockIcon('ClipboardDocumentListIcon');
export const ClipboardDocumentCheckIcon = createMockIcon('ClipboardDocumentCheckIcon');
export const PaperClipIcon = createMockIcon('PaperClipIcon');
export const PaperAirplaneIcon = createMockIcon('PaperAirplaneIcon');
export const ChatBubbleLeftIcon = createMockIcon('ChatBubbleLeftIcon');
export const ChatBubbleLeftRightIcon = createMockIcon('ChatBubbleLeftRightIcon');
export const ChatBubbleBottomCenterIcon = createMockIcon('ChatBubbleBottomCenterIcon');
export const ChatBubbleBottomCenterTextIcon = createMockIcon('ChatBubbleBottomCenterTextIcon');
export const ChatBubbleOvalLeftIcon = createMockIcon('ChatBubbleOvalLeftIcon');
export const ChatBubbleOvalLeftEllipsisIcon = createMockIcon('ChatBubbleOvalLeftEllipsisIcon');
export const MegaphoneIcon = createMockIcon('MegaphoneIcon');
export const SpeakerphoneIcon = createMockIcon('SpeakerphoneIcon');
export const NoSymbolIcon = createMockIcon('NoSymbolIcon');
export const HandRaisedIcon = createMockIcon('HandRaisedIcon');
export const HandThumbUpIcon = createMockIcon('HandThumbUpIcon');
export const HandThumbDownIcon = createMockIcon('HandThumbDownIcon');
export const FaceSmileIcon = createMockIcon('FaceSmileIcon');
export const FaceFrownIcon = createMockIcon('FaceFrownIcon');
export const FireIcon = createMockIcon('FireIcon');
export const BoltIcon = createMockIcon('BoltIcon');
export const LightBulbIcon = createMockIcon('LightBulbIcon');
export const SunIcon = createMockIcon('SunIcon');
export const MoonIcon = createMockIcon('MoonIcon');
export const CloudSunIcon = createMockIcon('CloudSunIcon');
export const CloudMoonIcon = createMockIcon('CloudMoonIcon');
export const BeakerIcon = createMockIcon('BeakerIcon');
export const FlaskIcon = createMockIcon('FlaskIcon');
export const WrenchIcon = createMockIcon('WrenchIcon');
export const WrenchScrewdriverIcon = createMockIcon('WrenchScrewdriverIcon');
export const HammerIcon = createMockIcon('HammerIcon');
export const ScissorsIcon = createMockIcon('ScissorsIcon');
export const PaintBrushIcon = createMockIcon('PaintBrushIcon');
export const SwatchIcon = createMockIcon('SwatchIcon');
export const EyeDropperIcon = createMockIcon('EyeDropperIcon');
export const CubeIcon = createMockIcon('CubeIcon');
export const CubeTransparentIcon = createMockIcon('CubeTransparentIcon');
export const Square3Stack3DIcon = createMockIcon('Square3Stack3DIcon');
export const RectangleStackIcon = createMockIcon('RectangleStackIcon');
export const CircleStackIcon = createMockIcon('CircleStackIcon');
export const BuildingOfficeIcon = createMockIcon('BuildingOfficeIcon');
export const BuildingOffice2Icon = createMockIcon('BuildingOffice2Icon');
export const BuildingStorefrontIcon = createMockIcon('BuildingStorefrontIcon');
export const BuildingLibraryIcon = createMockIcon('BuildingLibraryIcon');
export const HomeModernIcon = createMockIcon('HomeModernIcon');
export const TruckIcon = createMockIcon('TruckIcon');
export const CarIcon = createMockIcon('CarIcon');
export const AirplaneIcon = createMockIcon('AirplaneIcon');
export const RocketLaunchIcon = createMockIcon('RocketLaunchIcon');
export const GiftIcon = createMockIcon('GiftIcon');
export const GiftTopIcon = createMockIcon('GiftTopIcon');
export const ShoppingBagIcon = createMockIcon('ShoppingBagIcon');
export const ShoppingCartIcon = createMockIcon('ShoppingCartIcon');
export const ReceiptPercentIcon = createMockIcon('ReceiptPercentIcon');
export const ReceiptRefundIcon = createMockIcon('ReceiptRefundIcon');
export const TicketIcon = createMockIcon('TicketIcon');
export const QrCodeIcon = createMockIcon('QrCodeIcon');
export const IdentificationIcon = createMockIcon('IdentificationIcon');
export const FingerPrintIcon = createMockIcon('FingerPrintIcon');
export const AcademicCapIcon = createMockIcon('AcademicCapIcon');
export const BookOpenIcon = createMockIcon('BookOpenIcon');
export const NewspaperIcon = createMockIcon('NewspaperIcon');
export const LanguageIcon = createMockIcon('LanguageIcon');
export const TranslateIcon = createMockIcon('TranslateIcon');
export const CommandLineIcon = createMockIcon('CommandLineIcon');
export const CodeBracketIcon = createMockIcon('CodeBracketIcon');
export const CodeBracketSquareIcon = createMockIcon('CodeBracketSquareIcon');
export const VariableIcon = createMockIcon('VariableIcon');
export const FunctionIcon = createMockIcon('FunctionIcon');
export const HashtagIcon = createMockIcon('HashtagIcon');
export const AtSymbolIcon = createMockIcon('AtSymbolIcon');
export const NumberedListIcon = createMockIcon('NumberedListIcon');
export const QueueListIcon = createMockIcon('QueueListIcon');
export const Bars4Icon = createMockIcon('Bars4Icon');
export const BarsArrowUpIcon = createMockIcon('BarsArrowUpIcon');
export const BarsArrowDownIcon = createMockIcon('BarsArrowDownIcon');
export const ArrowUpIcon = createMockIcon('ArrowUpIcon');
export const ArrowDownIcon = createMockIcon('ArrowDownIcon');
export const ArrowLeftIcon = createMockIcon('ArrowLeftIcon');
export const ArrowRightIcon = createMockIcon('ArrowRightIcon');
export const ArrowUpRightIcon = createMockIcon('ArrowUpRightIcon');
export const ArrowUpLeftIcon = createMockIcon('ArrowUpLeftIcon');
export const ArrowDownRightIcon = createMockIcon('ArrowDownRightIcon');
export const ArrowDownLeftIcon = createMockIcon('ArrowDownLeftIcon');
export const ArrowLongUpIcon = createMockIcon('ArrowLongUpIcon');
export const ArrowLongDownIcon = createMockIcon('ArrowLongDownIcon');
export const ArrowLongLeftIcon = createMockIcon('ArrowLongLeftIcon');
export const ArrowLongRightIcon = createMockIcon('ArrowLongRightIcon');
export const ArrowUturnUpIcon = createMockIcon('ArrowUturnUpIcon');
export const ArrowUturnDownIcon = createMockIcon('ArrowUturnDownIcon');
export const ArrowUturnLeftIcon = createMockIcon('ArrowUturnLeftIcon');
export const ArrowUturnRightIcon = createMockIcon('ArrowUturnRightIcon');
export const ArrowPathIcon = createMockIcon('ArrowPathIcon');
export const ArrowPathRoundedSquareIcon = createMockIcon('ArrowPathRoundedSquareIcon');
export const ArrowsRightLeftIcon = createMockIcon('ArrowsRightLeftIcon');
export const ArrowsUpDownIcon = createMockIcon('ArrowsUpDownIcon');
export const ArrowsPointingInIcon = createMockIcon('ArrowsPointingInIcon');
export const ArrowsPointingOutIcon = createMockIcon('ArrowsPointingOutIcon');
export const ArrowTopRightOnSquareIcon = createMockIcon('ArrowTopRightOnSquareIcon');
export const ArrowDownOnSquareIcon = createMockIcon('ArrowDownOnSquareIcon');
export const ArrowUpOnSquareIcon = createMockIcon('ArrowUpOnSquareIcon');
export const ArrowDownTrayIcon = createMockIcon('ArrowDownTrayIcon');
export const ArrowUpTrayIcon = createMockIcon('ArrowUpTrayIcon');
export const ArrowTrendingUpIcon = createMockIcon('ArrowTrendingUpIcon');
export const ArrowTrendingDownIcon = createMockIcon('ArrowTrendingDownIcon');
export const EllipsisHorizontalIcon = createMockIcon('EllipsisHorizontalIcon');
export const EllipsisVerticalIcon = createMockIcon('EllipsisVerticalIcon');
export const EllipsisHorizontalCircleIcon = createMockIcon('EllipsisHorizontalCircleIcon');

// Default export for the entire module
export default {
  MicrophoneIcon,
  StopIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkIcon,
  ShareIcon,
  DownloadIcon,
  UploadIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  HeartIcon,
  StarIcon,
  BookmarkIcon,
  TagIcon,
  FlagIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  CreditCardIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChartLineIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  PhotoIcon,
  CameraIcon,
  VideoCameraIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerXMarkIcon,
  MusicalNoteIcon,
  RadioIcon,
  TvIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  WifiIcon,
  SignalIcon,
  BatteryIcon,
  PowerIcon,
  CpuChipIcon,
  ServerIcon,
  CloudIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  InboxIcon,
  InboxArrowDownIcon,
  ArchiveBoxIcon,
  ArchiveBoxArrowDownIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
  DocumentMinusIcon,
  ClipboardIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  MegaphoneIcon,
  SpeakerphoneIcon,
  NoSymbolIcon,
  HandRaisedIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  FireIcon,
  BoltIcon,
  LightBulbIcon,
  SunIcon,
  MoonIcon,
  CloudSunIcon,
  CloudMoonIcon,
  BeakerIcon,
  FlaskIcon,
  WrenchIcon,
  WrenchScrewdriverIcon,
  HammerIcon,
  ScissorsIcon,
  PaintBrushIcon,
  SwatchIcon,
  EyeDropperIcon,
  CubeIcon,
  CubeTransparentIcon,
  Square3Stack3DIcon,
  RectangleStackIcon,
  CircleStackIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  BuildingLibraryIcon,
  HomeModernIcon,
  TruckIcon,
  CarIcon,
  AirplaneIcon,
  RocketLaunchIcon,
  GiftIcon,
  GiftTopIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  ReceiptRefundIcon,
  TicketIcon,
  QrCodeIcon,
  IdentificationIcon,
  FingerPrintIcon,
  AcademicCapIcon,
  BookOpenIcon,
  NewspaperIcon,
  LanguageIcon,
  TranslateIcon,
  CommandLineIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  VariableIcon,
  FunctionIcon,
  HashtagIcon,
  AtSymbolIcon,
  NumberedListIcon,
  QueueListIcon,
  Bars4Icon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowUpLeftIcon,
  ArrowDownRightIcon,
  ArrowDownLeftIcon,
  ArrowLongUpIcon,
  ArrowLongDownIcon,
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
  ArrowUturnUpIcon,
  ArrowUturnDownIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
  ArrowsUpDownIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  EllipsisHorizontalCircleIcon
};
