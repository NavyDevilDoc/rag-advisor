import { PAGE } from "../styles/tokens.js";
import {
  BrandStrip,
  BackLink,
  PageFooter,
  H1,
  Lede,
  H2,
  P,
  Strong,
  Link,
} from "./longform.jsx";

const REPO = "https://github.com/NavyDevilDoc/rag-advisor";

export default function Privacy() {
  return (
    <div style={PAGE}>
      <BrandStrip />
      <article style={{ maxWidth: 620, margin: "0 auto" }}>
        <BackLink />
        <H1>Privacy</H1>
        <Lede>
          Last updated: 2026-05-14. This is a personal project; privacy is
          taken seriously. If you want absolute privacy, the tool's source is
          on GitHub and you can self-host.
        </Lede>

        <H2>What we don't collect</H2>
        <P>
          <Strong>No names, emails, or accounts.</Strong> The wizard requires
          no signup. There is nothing to sign up for.
        </P>
        <P>
          <Strong>No tracking cookies.</Strong> We don't use ad networks. We
          don't share or sell data — there's nothing to share or sell.
        </P>
        <P>
          <Strong>Your answers are not stored on our servers.</Strong> The
          wizard's local persistence (so refreshing the page doesn't lose your
          work) happens entirely in your browser via <code>localStorage</code>.
          We never see it.
        </P>

        <H2>What we do collect</H2>
        <P>
          <Strong>Anonymous usage analytics</Strong> (if configured). When
          enabled, page views and a small number of custom events (wizard
          start, step completion, share-link copy) are sent to a
          privacy-respecting analytics provider that doesn't use cookies and
          doesn't store IP addresses — only aggregated counts. The current
          provider, if active, is named in the network requests issued by your
          browser and you can verify what's being sent at any time.
        </P>
        <P>
          <Strong>Your 12 answers are sent to Anthropic's Claude API</Strong>{" "}
          to generate the two AI-written paragraphs on the results page (see{" "}
          <Link href="/methodology">Methodology</Link>). Per Anthropic's
          published policy, API content is used only to fulfill the request,
          not to train their models, and is retained briefly for abuse
          detection before being deleted. Your answers are sent without any
          identifying information attached to them.
        </P>
        <P>
          <Strong>Feedback you submit</Strong> through the thumbs-up / thumbs-down
          widget at the bottom of the results page is logged so the author can
          read it. The submission is associated with a request timestamp and
          your truncated IP (for abuse rate-limiting only), not with any
          identifier you provided to us.
        </P>

        <H2>Server logs</H2>
        <P>
          Our hosting provider (Railway) captures standard request logs (IP,
          timestamp, path, response code). These exist for security and
          debugging only — we don't analyze them for usage patterns. Railway's
          standard retention policy applies.
        </P>

        <H2>Open source</H2>
        <P>
          The full source is at{" "}
          <Link href={REPO}>github.com/NavyDevilDoc/rag-advisor</Link>. If you
          want to verify any claim above, the code is the source of truth. Pull
          requests improving the privacy posture are welcome.
        </P>

        <H2>Questions</H2>
        <P>
          File a <Link href={`${REPO}/issues`}>GitHub issue</Link> or email{" "}
          <Link href="mailto:jeremy.springston@gmail.com">
            jeremy.springston@gmail.com
          </Link>
          .
        </P>

        <PageFooter />
      </article>
    </div>
  );
}
