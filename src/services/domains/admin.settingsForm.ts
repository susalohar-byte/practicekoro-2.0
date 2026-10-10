/** Validation for the real Settings workflows; no unused preferences are presented as live features. */
export function validateGeneralSettings(values: {
  name: string;
  website: string;
  adminEmail: string;
  supportEmail: string;
}) {
  if (!values.name.trim()) throw new Error('Platform name is required.');
  let url: URL;
  try {
    url = new URL(values.website);
  } catch {
    throw new Error('Enter a valid HTTPS website URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('Enter a valid HTTPS website URL without credentials.');
  for (const email of [values.adminEmail, values.supportEmail])
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      throw new Error('Enter valid admin and support email addresses.');
}
export function validateBrandColors(colors: string[]) {
  if (colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c)))
    throw new Error('Use six-digit hexadecimal brand colors, such as #2563EB.');
}
export function validateSmtpReference(host: string, port: string) {
  if (!host.trim() || /[\s/]/.test(host.trim()))
    throw new Error('Enter an SMTP hostname without spaces or a URL prefix.');
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error('SMTP port must be an integer from 1 to 65535.');
}
export function validateSettingsImage(file: File, kind: 'logo' | 'favicon' | 'avatar') {
  const allowed = kind === 'favicon' ? ['image/png'] : ['image/png', 'image/jpeg'];
  if (!allowed.includes(file.type))
    throw new Error(
      kind === 'logo'
        ? 'Logo must be PNG or JPEG. SVG uploads are not supported.'
        : kind === 'avatar'
          ? 'Profile photo must be PNG or JPEG.'
          : 'Favicon must be PNG. ICO uploads are not supported.'
    );
  if (!file.size || file.size > 2 * 1024 * 1024)
    throw new Error('Choose a non-empty image no larger than 2 MB.');
}
