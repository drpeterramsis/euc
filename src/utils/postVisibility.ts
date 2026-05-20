export function canUserSeePost(post: any, user: any): boolean {
  const r = user?.role?.trim().toLowerCase();
  if (r === "admin") return true;
  if (!post.audienceType || post.audienceType === "all") return true;
  if (post.audienceType === "roles") {
    return (post.audienceRoles ?? []).includes(user?.role) || (post.audienceRoles ?? []).map((roleStr: string) => roleStr?.trim().toLowerCase()).includes(r);
  }
  if (post.audienceType === "users") {
    return (post.audienceUserIds ?? []).includes(user?.id);
  }
  return true;
}

export function isPostVisible(post: any, user: any): boolean {
  const r = user?.role?.trim().toLowerCase();
  // 1. Audience check — does this user have access?
  if (!canUserSeePost(post, user)) return false;

  // 2. Scheduled check — is it time yet?
  if (post.scheduledAt) {
    const publishTime = new Date(post.scheduledAt).getTime();
    const now = Date.now();
    
    // Normal users shouldn't see it if it's scheduled for the future
    if (now < publishTime && r !== "admin") return false; 
    // wait, admin can see everything anyway? "Admin sees ALL posts regardless of targeting" 
    // But the prompt says "isPostVisible -> Scheduled check", wait. 
    // If admin is viewing Media page, they should see it with "Scheduled" badge.
    // The prompt says: "Admin sees ALL posts regardless of targeting", yes, canUserSeePost already handles this.
    // BUT does admin see scheduled posts on Media page?
    // "Scheduled posts are hidden from all users before the scheduled datetime... Admin sees 'Scheduled' blue badge on future-scheduled posts". To see the badge, they must be visible to Admin.
    if (now < publishTime && r !== "admin") return false;
  }

  return true;
}

export function shouldShowOnDashboard(post: any, user: any): boolean {
  // Must pass visibility check
  if (!isPostVisible(post, user)) return false;

  // Coming Soon posts never appear on Dashboard
  // check boolean field but also fallbacks to previous implementations
  if (
    post.comingSoon === true ||
    post.isComingSoon === true ||
    post.status === "coming_soon" ||
    post.visibility === "coming_soon" ||
    post.visibility === "comingSoon" ||
    (typeof post.category === 'string' && post.category.toLowerCase() === 'coming soon')
  ) {
    return false;
  }

  return true;
}
