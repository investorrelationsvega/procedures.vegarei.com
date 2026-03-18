export default function EditorToolbar({ editor }) {
  if (!editor) return null

  const btn = (label, action, active) => (
    <button
      key={label}
      onClick={action}
      title={label}
      className={`px-2.5 py-1.5 text-xs font-mono border transition-colors ${
        active
          ? 'bg-black text-white border-black'
          : 'border-gray-300 text-gray-700 hover:border-black'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap gap-1.5 px-6 py-3 border-b border-gray-200 bg-gray-50 sticky top-14 z-10">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}

      <div className="w-px bg-gray-300 mx-1" />

      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}

      <div className="w-px bg-gray-300 mx-1" />

      {btn('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}

      <div className="w-px bg-gray-300 mx-1" />

      {btn('Table', () =>
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        false
      )}
      {btn('+ Row', () => editor.chain().focus().addRowAfter().run(), false)}
      {btn('+ Col', () => editor.chain().focus().addColumnAfter().run(), false)}
      {btn('Del Row', () => editor.chain().focus().deleteRow().run(), false)}
    </div>
  )
}
