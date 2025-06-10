'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, X } from 'lucide-react';
import type { CustomElement } from '@/types';

interface SlateDebugPanelProps {
  editorValue: CustomElement[];
  isVisible: boolean;
  onClose: () => void;
}

export default function SlateDebugPanel({
  editorValue,
  isVisible,
  onClose,
}: SlateDebugPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!isVisible) return null;

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(editorValue, null, 2));
  };

  const renderNode = (
    node: unknown,
    path: string = '',
    depth: number = 0
  ): React.ReactElement => {
    const isExpanded = expandedNodes.has(path);
    const nodeObj = node as Record<string, unknown>;
    const hasChildren = nodeObj.children && Array.isArray(nodeObj.children);
    const isTextNode = typeof nodeObj.text === 'string';

    const indent = depth * 16;

    if (isTextNode) {
      return (
        <div key={path} style={{ marginLeft: indent }} className="py-1">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              text:
            </span>
            <span className="text-green-600 dark:text-green-400 font-mono">
              &quot;{String(nodeObj.text)}&quot;
            </span>
            {Object.keys(nodeObj).length > 1 && (
              <span className="text-gray-500 dark:text-gray-400">
                {Object.keys(nodeObj)
                  .filter((key) => key !== 'text')
                  .map((key) => `${key}: ${JSON.stringify(nodeObj[key])}`)
                  .join(', ')}
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={path} style={{ marginLeft: indent }} className="py-1">
        <div className="flex items-start gap-2">
          {hasChildren ? (
            <button
              onClick={() => toggleNode(path)}
              className="flex-shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : null}

          <div className="flex-1 text-sm">
            <span className="text-purple-600 dark:text-purple-400 font-mono">
              {String(nodeObj.type || 'element')}
            </span>
            {nodeObj.type ? (
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                type: &quot;{String(nodeObj.type)}&quot;
              </span>
            ) : null}
            {Object.keys(nodeObj).filter(
              (key) => key !== 'type' && key !== 'children'
            ).length > 0 ? (
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                {Object.keys(nodeObj)
                  .filter((key) => key !== 'type' && key !== 'children')
                  .map((key) => `${key}: ${JSON.stringify(nodeObj[key])}`)
                  .join(', ')}
              </span>
            ) : null}
          </div>
        </div>

        {hasChildren && isExpanded ? (
          <div className="mt-1">
            {(nodeObj.children as unknown[]).map(
              (child: unknown, index: number) =>
                renderNode(child, `${path}.children[${index}]`, depth + 1)
            )}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Slate Editor Debug
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {editorValue.length} block{editorValue.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Copy JSON to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Close debug panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-auto max-h-64 p-4 font-mono text-xs">
        {editorValue.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 italic">
            No content in editor
          </div>
        ) : (
          <div>
            {editorValue.map((node, index) =>
              renderNode(node, `root[${index}]`, 0)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
