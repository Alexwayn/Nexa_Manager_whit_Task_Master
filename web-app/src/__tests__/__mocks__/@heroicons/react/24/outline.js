import React from 'react';

// Centralized Heroicons mock for all voice tests
const createMockIcon = (iconName, emoji = null) => {
  const MockIcon = React.forwardRef((props, ref) => {
    if (emoji) {
      // For specific icons that need text content (like MicrophoneIcon, StopIcon)
      return React.createElement('div', { 
        ref, 
        'data-testid': `${iconName.toLowerCase()}-icon`,
        'aria-hidden': 'true',
        ...props 
      }, emoji);
    }
    
    // For generic icons, return an SVG element
    return React.createElement('svg', { 
      ref,
      'data-testid': `${iconName.toLowerCase()}-icon`,
      'aria-hidden': 'true',
      role: 'img',
      ...props 
    });
  });
  
  MockIcon.displayName = `Mock${iconName}`;
  return MockIcon;
};

// Export commonly used voice icons with specific content where needed
export const MicrophoneIcon = createMockIcon('Microphone', '🎤');
export const StopIcon = createMockIcon('Stop', '⏹️');

// VoiceFeedback specific icons
export const ChatBubbleLeftRightIcon = createMockIcon('ChatBubbleLeftRight');
export const LightBulbIcon = createMockIcon('LightBulb');
export const ChartBarIcon = createMockIcon('ChartBar');
export const PlusIcon = createMockIcon('Plus');
export const CogIcon = createMockIcon('Cog');
// Newly added for VoiceFeedbackModal
export const StarIcon = createMockIcon('Star');
export const HandThumbUpIcon = createMockIcon('HandThumbUp');
export const HandThumbDownIcon = createMockIcon('HandThumbDown');

// Other common voice icons
export const PlayIcon = createMockIcon('Play');
export const PauseIcon = createMockIcon('Pause');
export const SpeakerWaveIcon = createMockIcon('SpeakerWave');
export const SpeakerXMarkIcon = createMockIcon('SpeakerXMark');
export const Cog6ToothIcon = createMockIcon('Cog6Tooth');
export const ExclamationTriangleIcon = createMockIcon('ExclamationTriangle');
export const CheckCircleIcon = createMockIcon('CheckCircle');
export const XMarkIcon = createMockIcon('XMark');
export const InformationCircleIcon = createMockIcon('InformationCircle');
export const CommandLineIcon = createMockIcon('CommandLine');
export const BoltIcon = createMockIcon('Bolt');
export const AdjustmentsHorizontalIcon = createMockIcon('AdjustmentsHorizontal');
export const ClockIcon = createMockIcon('Clock');
export const SignalIcon = createMockIcon('Signal');
export const WifiIcon = createMockIcon('Wifi');
export const ExclamationCircleIcon = createMockIcon('ExclamationCircle');

// Additional icons found in codebase
export const ArrowLeftIcon = createMockIcon('ArrowLeft');
export const ArrowRightIcon = createMockIcon('ArrowRight');
export const ArrowUpIcon = createMockIcon('ArrowUp');
export const ArrowDownIcon = createMockIcon('ArrowDown');
export const CheckIcon = createMockIcon('Check');
export const ChevronDownIcon = createMockIcon('ChevronDown');
export const ChevronUpIcon = createMockIcon('ChevronUp');
export const ChevronLeftIcon = createMockIcon('ChevronLeft');
export const ChevronRightIcon = createMockIcon('ChevronRight');
export const DocumentIcon = createMockIcon('Document');
export const DocumentTextIcon = createMockIcon('DocumentText');
export const FolderIcon = createMockIcon('Folder');
export const HomeIcon = createMockIcon('Home');
export const QuestionMarkCircleIcon = createMockIcon('QuestionMarkCircle');
export const UserIcon = createMockIcon('User');
export const UsersIcon = createMockIcon('Users');
export const MagnifyingGlassIcon = createMockIcon('MagnifyingGlass');
export const FunnelIcon = createMockIcon('Funnel');
export const TableCellsIcon = createMockIcon('TableCells');
export const Squares2X2Icon = createMockIcon('Squares2X2');
export const CameraIcon = createMockIcon('Camera');
export const DocumentArrowUpIcon = createMockIcon('DocumentArrowUp');
export const DocumentArrowDownIcon = createMockIcon('DocumentArrowDown');
export const CalendarIcon = createMockIcon('Calendar');
export const PrinterIcon = createMockIcon('Printer');
export const PhotoIcon = createMockIcon('Photo');
export const TagIcon = createMockIcon('Tag');
export const PencilIcon = createMockIcon('Pencil');
export const TrashIcon = createMockIcon('Trash');
export const BellIcon = createMockIcon('Bell');
export const EnvelopeIcon = createMockIcon('Envelope');
export const DevicePhoneMobileIcon = createMockIcon('DevicePhoneMobile');
export const CpuChipIcon = createMockIcon('CpuChip');
export const ServerIcon = createMockIcon('Server');
export const ShieldCheckIcon = createMockIcon('ShieldCheck');
export const CreditCardIcon = createMockIcon('CreditCard');
export const BuildingOfficeIcon = createMockIcon('BuildingOffice');
export const IdentificationIcon = createMockIcon('Identification');
export const MapPinIcon = createMockIcon('MapPin');
export const ArrowUpTrayIcon = createMockIcon('ArrowUpTray');
export const ArrowTrendingUpIcon = createMockIcon('ArrowTrendingUp');
export const ArrowTrendingDownIcon = createMockIcon('ArrowTrendingDown');
export const CloudArrowUpIcon = createMockIcon('CloudArrowUp');
export const XCircleIcon = createMockIcon('XCircle');
export const DocumentPlusIcon = createMockIcon('DocumentPlus');
export const ArrowPathIcon = createMockIcon('ArrowPath');

// Default export for any other icon not explicitly defined
const defaultMockIcon = createMockIcon('Default');
export default defaultMockIcon;