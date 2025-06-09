import { RenderLeafProps } from 'slate-react';
import type { CustomText } from '@/types';

export default function RenderLeaf({
  attributes,
  children,
  leaf,
}: RenderLeafProps) {
  const customLeaf = leaf as CustomText;

  let element = <span {...attributes}>{children}</span>;

  if (customLeaf.bold) {
    element = <strong className="font-bold">{element}</strong>;
  }

  if (customLeaf.italic) {
    element = <em className="italic">{element}</em>;
  }

  if (customLeaf.underline) {
    element = <u className="underline">{element}</u>;
  }

  return element;
}
