import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface InvitationEmailProps {
  username?: string;
  invitedByUsername?: string;
  invitedByEmail?: string;
  organizationName?: string;
  organizationLogo?: string;
  inviteLink?: string;
}

export const InvitationEmail = ({
  username,
  invitedByUsername,
  invitedByEmail,
  organizationName,
  organizationLogo,
  inviteLink,
}: InvitationEmailProps) => {
  const previewText = `Join ${invitedByUsername} on DocuFinance`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                // Matching globals.css theme
                primary: '#c9ef1c', // oklch(0.91 0.24 115) - lime
                'primary-foreground': '#1a1a1a', // oklch(0.13 0 0)
                background: '#ffffff', // oklch(1 0 0)
                foreground: '#262626', // oklch(0.15 0 0)
                muted: '#f5f5f5', // oklch(0.96 0 0)
                'muted-foreground': '#737373', // oklch(0.45 0 0)
                border: '#e5e5e5', // oklch(0.90 0 0)
                destructive: '#ef4444', // red
              },
            },
          },
        }}
      >
        <Body className="bg-muted my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-border rounded-lg my-[40px] mx-auto p-[32px] max-w-[465px] bg-background shadow-sm">
            {/* Logo */}
            <Section className="text-center mb-[24px]">
              <Img
                src={`${process.env.NEXT_PUBLIC_APP_URL}/docu-finance-logo.png`}
                width="40"
                height="40"
                alt="DocuFinance"
                className="mx-auto"
              />
            </Section>

            <Heading className="text-foreground text-[24px] font-semibold text-center p-0 my-[24px] mx-0">
              Join <strong>{organizationName}</strong> on{' '}
              <span className="text-primary">DocuFinance</span>
            </Heading>

            <Text className="text-foreground text-[14px] leading-[24px]">
              Hello {username || 'there'},
            </Text>

            <Text className="text-foreground text-[14px] leading-[24px]">
              <strong>{invitedByUsername}</strong> (
              <Link href={`mailto:${invitedByEmail}`} className="text-primary no-underline">
                {invitedByEmail}
              </Link>
              ) has invited you to join the <strong>{organizationName}</strong> organization on{' '}
              <strong>DocuFinance</strong>.
            </Text>

            {organizationLogo && (
              <Section className="my-[24px]">
                <Row>
                  <Column align="center">
                    <Img
                      className="rounded-lg"
                      src={organizationLogo}
                      width="64"
                      height="64"
                      alt={organizationName}
                    />
                  </Column>
                </Row>
              </Section>
            )}

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-primary text-primary-foreground rounded-lg text-[14px] font-semibold no-underline text-center px-6 py-3"
                href={inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>

            <Text className="text-muted-foreground text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link href={inviteLink} className="text-primary no-underline break-all">
                {inviteLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-border my-[26px] mx-0 w-full" />

            <Text className="text-muted-foreground text-[12px] leading-[20px]">
              This invitation was intended for <span className="text-foreground">{username}</span>.
              If you were not expecting this invitation, you can ignore this email.
            </Text>

            <Text className="text-muted-foreground text-[11px] leading-[18px] text-center mt-[24px]">
              © {new Date().getFullYear()} DocuFinance. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function reactInvitationEmail(props: InvitationEmailProps) {
  return <InvitationEmail {...props} />;
}
