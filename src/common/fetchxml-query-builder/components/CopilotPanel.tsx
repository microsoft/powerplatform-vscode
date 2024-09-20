/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import React, { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
    style?: React.CSSProperties;
}



const ChatInput: React.FC<ChatInputProps> = ({ style}) => {
    const [message, setMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    };

    const handleSendClick = () => {
        if (message.trim()) {
            setMessage('');
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        chatInput: {
            display: 'flex',
            flexDirection: 'column',
            margin: '0px',
            padding: '12px',
            paddingLeft: '0px'
        },
        inputLabel: {
            marginBottom: '1px',
            color: 'var(--vscode-input-placeholderForeground)',
            fontSize: '12px',
            padding: '5px 0px 5px 10px',
            height: 'auto',
            boxSizing: 'border-box',
        },
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--vscode-dropdown-border)',
            padding: '0px 6px 0px 0px',
            borderRadius: '4px',
            height: '38px',
            backgroundColor: 'var(--vscode-interactiveEditorInput-background)',
        },
        inputContainerFocusWithin: {
            boxShadow: '0 0 0 1px var(--vscode-focusBorder)',
        },
        inputField: {
            flex: 1,
            padding: '11px 0px 11px 8px',
            border: 'none',
            outline: 'none',
            color: 'var(--vscode-inputOption-activeForeground)',
            backgroundColor: 'transparent',
            resize: 'none',
            fontFamily: 'var(--vscode-font-family)',
        },
        inputFieldPlaceholder: {
            color: 'var(--vscode-input-placeholderForeground)',
        },
        sendButton: {
            marginLeft: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
        },
        disclaimer: {
            margin: '0px',
            marginTop: '12px',
            color: 'var(--vscode-titleBar-inactiveForeground)',
            fontSize: '12px',
        },
        sendIcon: {
            fill: 'var(--vscode-inputOption-activeForeground)',
        },
    };

    return (
        <div style={style}>
        <h4>FetchXml Copilot</h4>
        <p>Welcome <b>John!</b> Use this tool to effortlessly generate queries and streamline your workflow. If you need assistance, simply type your query requirement below and hit the send button.</p>
        <br/>
        <div style={styles.chatInput} id="input-component">
            <label htmlFor="chat-input" style={styles.inputLabel} id="input-label-id"></label>
            <div style={styles.inputContainer}>
                <textarea
                    rows={1}
                    placeholder="What do you need help with?"
                    id="chat-input"
                    style={styles.inputField}
                    value={message}
                    onChange={handleInputChange}
                ></textarea>
                <button
                    aria-label="Match Case"
                    id="send-button"
                    style={styles.sendButton}
                    onClick={handleSendClick}
                >
                    {<SendIcon style={styles.sendIcon} />}
                </button>
            </div>
            <p style={styles.disclaimer}>
                Make sure AI-generated content is accurate and appropriate before using.{' '}
                <a href="https://go.microsoft.com/fwlink/?linkid=2240145" style={styles.link}>Learn more</a> |{' '}
                <a href="https://go.microsoft.com/fwlink/?linkid=2189520" style={styles.link}>View terms</a>
            </p>
        </div>
        </div>
    );
};

export default ChatInput;
