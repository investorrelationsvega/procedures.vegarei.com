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
        <p>Navigate to a business unit and click <strong>Create SOP</strong>. Fill in the title, category, owner, and other details. Once created, you will enter the editor.</p>
      </Section>

      <Section title="Writing an SOP with AI">
        <p>The editor gives you a one-click <strong>Copy Prompt</strong> button. This copies a comprehensive prompt based on the Vega SOP Generation Template. Here is the process:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click <strong>Copy Prompt</strong> in the editor</li>
          <li>Paste it into your preferred AI (ChatGPT, Gemini, Claude, or any other)</li>
          <li>Describe your process to the AI in your own words</li>
          <li>The AI will produce a complete SOP matching Vega's format, tone, and structure</li>
          <li>Copy the AI's response and paste it back into the editor</li>
          <li>Click <strong>Done</strong> to review, then <strong>Save and Close</strong></li>
        </ol>
        <p>Every SOP comes out uniform: same sections, same tone, same level of detail.</p>
      </Section>

      <Section title="Download the Template">
        <p>Download the Vega SOP Generation Template. Load it into any AI assistant, describe your process, and the AI will produce a complete SOP. Upload the result to procedures.vegarei.com or return it to j@vegarei.com.</p>
        <a
          href="/Vega_SOP_Generation_Template.docx"
          download
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 border border-[#27474D] text-[#27474D] text-xs font-mono hover:bg-[#27474D] hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download Template (.docx)
        </a>
      </Section>

      <Section title="Editing an Existing SOP">
        <p>Open any SOP and click <strong>Edit</strong>. If the SOP already has content, you will see a review of all filled sections. Click <strong>Back to Input</strong> to paste updated content from your AI, then save.</p>
      </Section>

      <Section title="Google Drive Sync">
        <p>All SOPs are stored as Google Docs in your organization's Shared Drive. When you save on the website, changes sync to Drive. The website shows the full formatted template. Google Drive shows the content in a readable format.</p>
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
      a: 'It copies the full Vega SOP Generation Template prompt to your clipboard. Paste it into any AI (ChatGPT, Gemini, Claude), describe your process, and the AI produces a complete SOP in the correct format. Copy the AI response back into the editor and click Done.',
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
