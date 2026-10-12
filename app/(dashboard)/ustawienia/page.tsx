import { requireAuthenticatedUser } from "@/lib/auth";
import { getOrganization, getTeamMembers } from "@/server/actions/settings";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/components/modules/settings/profile-form";
import { PasswordForm } from "@/components/modules/settings/password-form";
import { OrganizationForm } from "@/components/modules/settings/organization-form";
import { TeamMembers } from "@/components/modules/settings/team-members";

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();
  const isOwner = user.role === "OWNER";

  const [org, members] = await Promise.all([
    getOrganization(),
    isOwner ? getTeamMembers() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ustawienia"
        description="Zarządzaj kontem i organizacją"
      />

      <ProfileForm fullName={user.fullName} email={user.email} />

      <PasswordForm />

      {isOwner && org && (
        <OrganizationForm name={org.name} nip={org.nip} />
      )}

      {isOwner && (
        <TeamMembers members={members} currentUserId={user.userId} />
      )}
    </div>
  );
}