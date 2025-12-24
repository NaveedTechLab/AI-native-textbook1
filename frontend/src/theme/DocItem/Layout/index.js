import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { useDoc } from '@docusaurus/theme-common/internal';
import UrduTranslationButton from '@site/src/components/translation/UrduTranslationButton';

/**
 * Docusaurus Theme Wrapper - DocItem/Layout
 *
 * Injects UrduTranslationButton into chapter pages
 * Button only appears if chapter has `chapter_id` in frontmatter
 */
export default function LayoutWrapper(props) {
  const { frontMatter } = useDoc();
  const chapterId = frontMatter?.chapter_id;

  return (
    <>
      <Layout {...props} />
      {/* Inject translation button if chapter has chapter_id */}
      {chapterId && (
        <div style={{
          margin: '2rem 0',
          padding: '0 var(--ifm-spacing-horizontal)'
        }}>
          <UrduTranslationButton chapterId={chapterId} />
        </div>
      )}
    </>
  );
}
