export const TEAM_POSITIONS = ["队长", "副队", "领队", "精英", "成员"] as const;

export type TeamPosition = (typeof TEAM_POSITIONS)[number];

export function isTeamPosition(value: string): value is TeamPosition {
  return TEAM_POSITIONS.includes(value as TeamPosition);
}

export function getSuggestedTeamPosition(roleLevel: number) {
  switch (roleLevel) {
    case 1:
      return "队长";
    case 2:
      return "副队";
    default:
      return "成员";
  }
}

export function getDisplayTeamPosition(
  positionTitle: string | null | undefined,
  roleLevel: number,
) {
  const normalized = positionTitle?.trim() ?? "";

  if (isTeamPosition(normalized)) {
    return normalized;
  }

  return getSuggestedTeamPosition(roleLevel);
}
