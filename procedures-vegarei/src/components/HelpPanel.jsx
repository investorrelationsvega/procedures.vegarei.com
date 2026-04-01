import { useState } from 'react'

const mono = { fontFamily: "'Space Mono', monospace" }

export default function HelpPanel({ onClose }) {
  const [tab, setTab] = useState('guide')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-[#111]">How This Works</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { id: 'guide', label: 'Guide' },
            { id: 'faq', label: 'FAQ' },
            { id: 'contact', label: 'Contact' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={mono}
              className={`text-[10px] uppercase tracking-wider py-3 mr-6 border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-black text-black font-bold'
                  : 'border-transparent text-gray-400 hover:text-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {tab === 'guide' && <GuideContent />}
          {tab === 'faq' && <FaqContent />}
          {tab === 'contact' && <ContactContent />}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-[#111] mb-2">{title}</h3>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

function GuideContent() {
  return (
    <>
      <Section title="Creating an SOP">
        <p>Navigate to a business unit and click <strong>Create SOP</strong>. Fill in the title, category, owner, and other details. Once created, you will enter the guided editor.</p>
        <p>The editor walks you through each section of the SOP one at a time. For each section you will see:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>A question explaining what to write</li>
          <li>A detailed explanation of the section</li>
          <li>An example of what good content looks like</li>
          <li>A text box where you type or paste your content</li>
        </ul>
        <p>Fill in what you can. Use <strong>Skip</strong> to move past sections you are not ready to complete. You can always come back to them later.</p>
      </Section>

      <Section title="Using the AI Prompt Helper">
        <p>Each section has a <strong>Copy Prompt</strong> button. This generates a ready-to-use prompt you can paste into any AI tool (ChatGPT, Gemini, Claude, or any other).</p>
        <p>The prompt includes the SOP title, section context, writing tone rules, and a place for your rough notes. Paste it into your AI, add your notes, copy the polished response, and paste it back into the editor.</p>
      </Section>

      <Section title="Editing an Existing SOP">
        <p>Open any SOP and click <strong>Edit</strong> in the action bar. The guided editor will load your existing content into each section. Sections you have already filled in will show your current text. Empty sections will be ready for input.</p>
        <p>Progress dots at the top show which sections are filled (green), empty (gray), or currently active (dark).</p>
      </Section>

      <Section title="Google Drive Sync">
        <p>All SOPs are stored as Google Docs in your organization's Shared Drive. When you save on the website, changes sync to Drive. When someone reads the SOP in Google Drive, they see the content (though without the website's visual formatting).</p>
        <p>The website is the best place to create and edit SOPs. Google Drive is useful for quick reading and sharing.</p>
      </Section>

      <Section title="Print and Download">
        <p><strong>Print</strong> opens your browser's print dialog with a clean, formatted version of the SOP optimized for paper.</p>
        <p><strong>Download</strong> saves the SOP as an HTML file to your computer.</p>
      </Section>

      <Section title="Version History and Revision History">
        <p><strong>Version History</strong> shows all saved revisions of the file from Google Drive, with dates and who made changes.</p>
        <p><strong>Revision History</strong> shows the change log tracked inside the SOP document itself (the table at the bottom of every SOP).</p>
      </Section>

      <Section title="Publishing">
        <p>New SOPs are created as <strong>drafts</strong>. Drafts show all template sections (including unfilled ones) so you can see what still needs to be completed.</p>
        <p>When ready, click <strong>Publish</strong>. Published SOPs hide any sections that were not filled in, showing only completed content for a clean final document.</p>
      </Section>

      <Section title="Archiving and Restoring">
        <p><strong>Archive</strong> moves the SOP and its metadata file into an Archive subfolder within the category folder in Google Drive. The SOP is hidden from the main list but can be restored at any time.</p>
        <p><strong>Restore</strong> moves the files back to the original category folder and makes the SOP visible again.</p>
      </Section>

      <Section title="Reclassifying">
        <p>Click <strong>Reclassify</strong> in the action bar to change an SOP's category. Select the new category from the dropdown. The files will be moved to the corresponding folder in Google Drive automatically.</p>
      </Section>

      <Section title="Discarding a Draft">
        <p>Draft SOPs that have not been published can be permanently deleted by clicking <strong>Discard</strong>. This removes the SOP from the index and deletes the files from Google Drive. This action cannot be undone.</p>
      </Section>

      <Section title="Review Cycles">
        <p>Each SOP has a review cadence (Quarterly, Biannually, Annually, or As Needed). When a review is due, a notification banner appears on the SOP page.</p>
        <p>To complete a review, open the SOP, verify all content is current, make any updates, then click <strong>Mark Review Complete</strong>.</p>
      </Section>
    </>
  )
}

function FaqContent() {
  const faqs = [
    {
      q: 'Who can see my SOPs?',
      a: 'SOPs are stored in your organization\'s Google Shared Drive. Anyone with access to the Shared Drive can view them in Google Drive. On the website, users must sign in with a Google account that has Drive access.',
    },
    {
      q: 'Can I edit SOPs directly in Google Docs?',
      a: 'You can, but the website is the recommended editor. Edits made in Google Docs will appear on the website, but the visual formatting (headers, phase bars, role badges) is applied by the website and will not display in Google Docs.',
    },
    {
      q: 'What happens when I archive an SOP?',
      a: 'The SOP files are moved to an Archive subfolder inside the category folder in Google Drive. The SOP is hidden from the main list on the website but is not deleted. You can restore it at any time.',
    },
    {
      q: 'How do I change the category of an SOP?',
      a: 'Open the SOP, click Reclassify in the action bar, and select the new category. The files are automatically moved to the new category folder in Google Drive.',
    },
    {
      q: 'Can I delete an SOP permanently?',
      a: 'Only draft (unpublished) SOPs can be permanently deleted using the Discard button. Published SOPs can be archived but not deleted from the website. To permanently delete a published SOP, archive it first and then delete the files from Google Drive manually.',
    },
    {
      q: 'What does the Copy Prompt button do?',
      a: 'It copies a pre-written prompt to your clipboard that you can paste into any AI tool (ChatGPT, Gemini, Claude, etc.). The prompt includes the section context, writing rules, and a place for your rough notes. The AI will polish your notes into clean SOP content that you can paste back into the editor.',
    },
    {
      q: 'Why do some sections not appear on the published SOP?',
      a: 'Sections that were not filled in during editing are hidden from the published view to keep the document clean. When you go back to edit, all sections (including unfilled ones) will be available to complete.',
    },
    {
      q: 'How does the review cycle work?',
      a: 'Each SOP has a review cadence set during creation. When a review is due, a banner appears on the SOP page. After reviewing and updating the content, click Mark Review Complete to reset the review timer.',
    },
  ]

  return (
    <div className="space-y-5">
      {faqs.map((faq, i) => (
        <div key={i}>
          <h3 className="text-sm font-bold text-[#111] mb-1">{faq.q}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
        </div>
      ))}
    </div>
  )
}

function ContactContent() {
  return (
    <div>
      <Section title="Support">
        <p>For questions, issues, or feature requests related to the procedures platform, contact:</p>
      </Section>

      <div className="bg-gray-50 border border-gray-200 rounded px-5 py-4">
        <div className="text-sm font-bold text-[#111] mb-1">J Jones</div>
        <div style={mono} className="text-[10px] uppercase tracking-wider text-[#797469] mb-3">
          Director, System Development and Implementation
        </div>
        <a href="mailto:J@vegarei.com" className="text-sm text-[#27474D] font-medium hover:underline">
          J@vegarei.com
        </a>
      </div>

      <div className="mt-6">
        <Section title="Reporting Issues">
          <p>When reporting an issue, include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The SOP ID and business unit</li>
            <li>What you were trying to do</li>
            <li>What happened instead</li>
            <li>A screenshot if possible</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}
