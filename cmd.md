Page: Schedule
if not an admin
// Auto template needs to list my cars only

if an admin, display all cars sorted ty isTemplate first then a

If not an admin, list scedules under My Schedules.
If I have no schedule show the "Add Schedule button

Page: schedule
If Admin, ability to edit and delete schedule

### PWA commands

> npx quasar build -m pwa
> npx http-server dist/pwa

### Debug commands

> npm run dev
> vs code > set break points > Menu: Run > Start Debugging

### Multifactor Auth - Off / On

> Supabase > DB > Authentication > Sign In / PRoviders > Confirm Email = Off,

### Now Published

Yes

### ⚙️ Profile preferences and sharing

- Manage shared-user email entries in Profile. When both users list each other's verified account
  email, each can view and edit the other's autos and related records. Removing either entry
  revokes the shared access.
- Deploy [profile-sharing-access.sql](src/sql/profile-sharing-access.sql) and
  [profile-sharing-policies.sql](src/sql/profile-sharing-policies.sql) with the app. Review
  existing database and storage policies before deployment; permissive policies can override
  access restrictions.
