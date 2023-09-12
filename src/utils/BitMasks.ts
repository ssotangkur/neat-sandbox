export const STAGE_GROUP = 0b0001;
export const ROCKET_GROUP = 0b0010;

// Membership is left 16 bits
export const STAGE_MEMBERSHIP = STAGE_GROUP << 16;
export const ROCKET_MEMBERSHIP = ROCKET_GROUP << 16;

// Filter is right 16 bits
export const STAGE_FILTER = STAGE_GROUP;
export const ROCKET_FILTER = ROCKET_GROUP;

// Member of Stage group but filters for rockets
export const STAGE_MASK = STAGE_MEMBERSHIP | ROCKET_FILTER;
// Member of Rocket group but filters for stage
export const ROCKET_MASK = ROCKET_MEMBERSHIP | STAGE_FILTER;
