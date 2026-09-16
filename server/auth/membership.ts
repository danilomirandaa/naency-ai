import 'server-only';
import { getMemberRole } from '@/server/dal/profiles';
import { getCurrentUser } from './current-user';
import { createMembershipGuard } from './membership-guard';

/** Use no início de toda função do DAL que toca dados de um espaço. */
export const requireMembership = createMembershipGuard({ getCurrentUser, getMemberRole });
