import React from 'react';
import Content from '@theme-original/DocItem/Content';
import PersonalizeButton from '@site/src/components/personalization/PersonalizeButton';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

export default function ContentWrapper(props) {
  const { frontMatter, metadata } = useDoc();
  const chapterId = frontMatter.chapter_id || metadata.id;

  return (
    <>
      {/* Inject PersonalizeButton at the top of chapter content */}
      {chapterId && (
        <div style={{ marginBottom: '2rem' }}>
          <PersonalizeButton chapterId={chapterId} />
        </div>
      )}
      <Content {...props} />
    </>
  );
}
