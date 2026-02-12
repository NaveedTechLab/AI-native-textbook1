import React from 'react';
import Layout from '@theme-original/Layout';
import ChatKitWidget from '@site/src/components/chatbot/ChatKitWidget';
import TextSelectionHandler from '@site/src/components/chatbot/TextSelectionHandler';

export default function LayoutWrapper(props) {
  return (
    <TextSelectionHandler>
      {({ selectedText, clearSelection }) => (
        <>
          <Layout {...props}>
            {props.children}
            <ChatKitWidget selectedText={selectedText} onTextSelected={clearSelection} />
          </Layout>
        </>
      )}
    </TextSelectionHandler>
  );
}