import { stripHtmlToText } from '@/lib/utils/sanitize';

describe('stripHtmlToText', () => {
  it('returns an empty string for null/undefined/empty input', () => {
    expect(stripHtmlToText(null)).toBe('');
    expect(stripHtmlToText(undefined)).toBe('');
    expect(stripHtmlToText('')).toBe('');
  });

  it('strips tags and converts <br>/<p> to newlines', () => {
    expect(stripHtmlToText('<b>Bold</b><br/>New line<p>Paragraph</p>')).toBe(
      'Bold\nNew line\nParagraph'
    );
  });

  it('decodes named HTML entities', () => {
    expect(stripHtmlToText('Rock &amp; roll')).toBe('Rock & roll');
    expect(stripHtmlToText('she said &quot;hi&quot;')).toBe('she said "hi"');
    expect(stripHtmlToText('a &lt; b &gt; c')).toBe('a < b > c');
    expect(stripHtmlToText('it&apos;s here')).toBe("it's here");
    expect(stripHtmlToText('a&nbsp;b')).toBe('a b');
  });

  it('decodes numeric (decimal and hex) entities', () => {
    expect(stripHtmlToText('it&#39;s a &#38; b')).toBe("it's a & b");
    expect(stripHtmlToText('em&#x2014;dash')).toBe('em—dash');
  });

  it('resolves a single level of encoding (&amp; decoded last)', () => {
    expect(stripHtmlToText('&amp;lt;')).toBe('&lt;');
  });

  it('leaves an out-of-range numeric ref untouched rather than throwing', () => {
    expect(stripHtmlToText('&#1114112;')).toBe('&#1114112;');
  });

  it('decodes entities inside stripped markup', () => {
    expect(stripHtmlToText('<p>Tom &amp; Jerry&#39;s</p>')).toBe("Tom & Jerry's");
  });
});
