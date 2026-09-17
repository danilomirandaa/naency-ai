import type { IconComponentType } from '@devigner-ui/icons';
import { IconAdd } from '@devigner-ui/icons/Add';
import { IconAlertCircle } from '@devigner-ui/icons/AlertCircle';
import { IconArchive } from '@devigner-ui/icons/Archive';
import { IconArchiveUp } from '@devigner-ui/icons/ArchiveUp';
import { IconArrowLeftDown } from '@devigner-ui/icons/ArrowLeftDown';
import { IconArrowRight } from '@devigner-ui/icons/ArrowRight';
import { IconArrowRightUp } from '@devigner-ui/icons/ArrowRightUp';
import { IconBank } from '@devigner-ui/icons/Bank';
import { IconBell } from '@devigner-ui/icons/Bell';
import { IconBillList } from '@devigner-ui/icons/BillList';
import { IconCalendar } from '@devigner-ui/icons/Calendar';
import { IconCard } from '@devigner-ui/icons/Card';
import { IconCheck } from '@devigner-ui/icons/Check';
import { IconChevronDown } from '@devigner-ui/icons/ChevronDown';
import { IconChevronLeft } from '@devigner-ui/icons/ChevronLeft';
import { IconChevronRight } from '@devigner-ui/icons/ChevronRight';
import { IconChevronUp } from '@devigner-ui/icons/ChevronUp';
import { IconClockCircle } from '@devigner-ui/icons/ClockCircle';
import { IconClose } from '@devigner-ui/icons/Close';
import { IconCopy } from '@devigner-ui/icons/Copy';
import { IconDiskette } from '@devigner-ui/icons/Diskette';
import { IconDoubleAltArrowLeft } from '@devigner-ui/icons/DoubleAltArrowLeft';
import { IconDoubleAltArrowRight } from '@devigner-ui/icons/DoubleAltArrowRight';
import { IconEye } from '@devigner-ui/icons/Eye';
import { IconGoogle } from '@devigner-ui/icons/Google';
import { IconGraphUp } from '@devigner-ui/icons/GraphUp';
import { IconInbox } from '@devigner-ui/icons/Inbox';
import { IconInfoCircle } from '@devigner-ui/icons/InfoCircle';
import { IconInfoSquare } from '@devigner-ui/icons/InfoSquare';
import { IconLayoutDashboard } from '@devigner-ui/icons/LayoutDashboard';
import { IconLogout2 } from '@devigner-ui/icons/Logout2';
import { IconMagnifer } from '@devigner-ui/icons/Magnifer';
import { IconMail } from '@devigner-ui/icons/Mail';
import { IconMenuDots } from '@devigner-ui/icons/MenuDots';
import { IconMonitor } from '@devigner-ui/icons/Monitor';
import { IconMoon } from '@devigner-ui/icons/Moon';
import { IconPen } from '@devigner-ui/icons/Pen';
import { IconPieChart2 } from '@devigner-ui/icons/PieChart2';
import { IconQuestionCircle } from '@devigner-ui/icons/QuestionCircle';
import { IconReceiptText } from '@devigner-ui/icons/ReceiptText';
import { IconRepeat } from '@devigner-ui/icons/Repeat';
import { IconSafeSquare } from '@devigner-ui/icons/SafeSquare';
import { IconSettings } from '@devigner-ui/icons/Settings';
import { IconShieldKeyhole } from '@devigner-ui/icons/ShieldKeyhole';
import { IconSidebarMinimalistic } from '@devigner-ui/icons/SidebarMinimalistic';
import { IconSortVertical } from '@devigner-ui/icons/SortVertical';
import { IconSpinner } from '@devigner-ui/icons/Spinner';
import { IconSun } from '@devigner-ui/icons/Sun';
import { IconTag } from '@devigner-ui/icons/Tag';
import { IconTarget } from '@devigner-ui/icons/Target';
import { IconTransferHorizontal } from '@devigner-ui/icons/TransferHorizontal';
import { IconTrashBinMinimalistic } from '@devigner-ui/icons/TrashBinMinimalistic';
import { IconUndoLeft } from '@devigner-ui/icons/UndoLeft';
import { IconUserRounded } from '@devigner-ui/icons/UserRounded';
import { IconWadOfMoney } from '@devigner-ui/icons/WadOfMoney';
import { IconWallet } from '@devigner-ui/icons/Wallet';

/**
 * Registro central de ícones (Devigner Icons, família Solar). Componentes
 * referenciam ícones pelo nome (`<Icon icon="delete" />`), nunca importando o
 * pacote direto, para que a troca de um ícone aconteça em um lugar só.
 *
 * - Importe por subcaminho (`@devigner-ui/icons/<Nome>`): o índice do pacote tem
 *   5,5 MB e deixaria o dev server lento.
 * - Use só ícones da família Solar (viewBox 24×24) para manter o traço consistente.
 * - Licença CC BY 4.0 exige atribuição: docs/credits.md.
 */
export const icons = {
  // Ações
  add: IconAdd,
  edit: IconPen,
  delete: IconTrashBinMinimalistic,
  save: IconDiskette,
  copy: IconCopy,
  close: IconClose,
  check: IconCheck,
  search: IconMagnifer,
  return: IconUndoLeft,
  settings: IconSettings,
  view: IconEye,
  archive: IconArchive,
  unarchive: IconArchiveUp,
  logout: IconLogout2,

  // Navegação
  'arrow-right': IconArrowRight,
  'chevron-up': IconChevronUp,
  'chevron-down': IconChevronDown,
  'chevron-left': IconChevronLeft,
  'chevron-right': IconChevronRight,
  'chevron-left-pipe': IconDoubleAltArrowLeft,
  'chevron-right-pipe': IconDoubleAltArrowRight,
  dots: IconMenuDots,
  sidebar: IconSidebarMinimalistic,
  selector: IconSortVertical,
  dashboard: IconLayoutDashboard,

  // Estado e feedback
  loading: IconSpinner,
  'alert-circle': IconAlertCircle,
  'info-icon': IconInfoCircle,
  'info-square': IconInfoSquare,
  inbox: IconInbox,
  clock: IconClockCircle,
  bell: IconBell,
  help: IconQuestionCircle,

  // Finanças
  income: IconArrowLeftDown,
  expense: IconArrowRightUp,
  transfer: IconTransferHorizontal,
  recurring: IconRepeat,
  wallet: IconWallet,
  'credit-card': IconCard,
  invoice: IconBillList,
  category: IconTag,
  calendar: IconCalendar,
  bank: IconBank,
  savings: IconSafeSquare,
  investment: IconGraphUp,
  cash: IconWadOfMoney,
  transactions: IconReceiptText,
  reports: IconPieChart2,
  goal: IconTarget,

  // Diversos
  mail: IconMail,
  user: IconUserRounded,
  'theme-light': IconSun,
  'theme-dark': IconMoon,
  'theme-system': IconMonitor,
  'shield-lock': IconShieldKeyhole,

  // Marcas (logos de terceiros; exceção à família Solar)
  google: IconGoogle,
} satisfies Record<string, IconComponentType>;

export type Icons = keyof typeof icons;
