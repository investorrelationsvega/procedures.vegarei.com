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
      <Section title="Download the Template">
        <p>Start by downloading the Vega SOP Generation Template. This document contains the master prompt and blank template that any AI assistant can use to produce a complete, correctly formatted SOP.</p>
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

      <Section title="Creating an SOP">
        <p>Navigate to a business unit and click <strong>Create SOP</strong>. You only need to provide:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Category</strong> (the SOP ID auto-generates from your business unit and category)</li>
          <li><strong>Title</strong></li>
          <li><strong>Owner</strong></li>
        </ul>
        <p>Review cadence defaults to Quarterly. You can also upload a .docx, .html, or .txt file if you already have content prepared.</p>
      </Section>

      <Section title="Writing an SOP with AI">
        <p>Once inside the editor, you will see a two-step process:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click <strong>Copy Prompt</strong>. This copies the full Vega SOP Generation Template prompt to your clipboard.</li>
          <li>Paste it into your preferred AI (ChatGPT, Gemini, Claude, or any other).</li>
          <li>Describe your process to the AI in your own words. Be as detailed as possible: what happens, who does it, what systems are used, and in what order.</li>
          <li>The AI will produce a complete SOP matching Vega's format, tone, and structure.</li>
          <li>Copy the AI's full response and paste it back into the editor.</li>
          <li>Click <strong>Done</strong> to review the parsed sections, then <strong>Save and Close</strong>.</li>
        </ol>
        <p>Every SOP comes out uniform: same sections, same tone, same level of detail. No formatting knowledge needed.</p>
      </Section>

      <Section title="SOP Template Structure">
        <p>Every SOP follows this structure:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li><strong>Overview</strong> - Purpose, trigger, successful completion, key systems</li>
          <li><strong>Procedure Steps</strong> - Numbered steps grouped into phases, each with a Maker or Checker role</li>
          <li><strong>Completion Checklist</strong> - Items to verify before closing out</li>
          <li><strong>Key Contacts</strong> - Everyone involved with contact info</li>
          <li><strong>Exceptions and Edge Cases</strong> - What can go wrong and what to do</li>
          <li><strong>Review Schedule</strong> - When this SOP is reviewed</li>
          <li><strong>Revision History</strong> - Change log</li>
        </ol>
      </Section>

      <Section title="Editing an Existing SOP">
        <p>Open any SOP and click <strong>Edit</strong>. If the SOP already has content, you will see a review of all filled sections. Click <strong>Back to Input</strong> to paste updated content from your AI, then save.</p>
      </Section>

      <Section title="Google Drive Sync">
        <p>All SOPs are stored as Google Docs in your organization's Shared Drive. When you save on the website, changes sync to Drive automatically. The website shows the full formatted template with Vega styling. Google Drive shows the content in a readable plain format.</p>
        <p>The website is the primary tool for creating and editing SOPs. Google Drive is for reading and sharing.</p>
      </Section>

      <Section title="Print and Download">
        <p><strong>Print</strong> opens your browser's print dialog with a clean version optimized for paper.</p>
        <p><strong>Download</strong> saves the SOP as an HTML file to your computer.</p>
      </Section>

      <Section title="Version History and Revision History">
        <p><strong>Version History</strong> shows all saved revisions from Google Drive with dates and who made changes.</p>
        <p><strong>Revision History</strong> is the change log table inside the SOP document itself (the last section of every SOP).</p>
      </Section>

      <Section title="Publishing and Drafts">
        <p>New SOPs are created as <strong>drafts</strong>. Drafts show all template sections so you can see what still needs to be completed.</p>
        <p>Click <strong>Publish</strong> when ready. Published SOPs hide unfilled sections for a clean final document. You can always edit and fill in more sections later.</p>
      </Section>

      <Section title="Review Calendar">
        <p>Click <strong>Reviews</strong> in the navigation bar to see all SOPs and their review status. The dashboard shows:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Summary cards: Total Active, Overdue, Due Soon, On Track</li>
          <li>Filter by owner (use "My SOPs" to see only yours)</li>
          <li>Filter by business unit</li>
          <li>Next review dates for every SOP</li>
        </ul>
        <p>To complete a review, open the SOP, verify all content is current, make any updates, then click <strong>Mark Review Complete</strong>.</p>
      </Section>

      <Section title="Template Updates">
        <p>The SOP template may be updated over time with new sections or structural changes. When this happens, existing SOPs are not changed automatically.</p>
        <p>Instead, a blue <strong>Template Updated</strong> banner will appear on any SOP created with an older template. During your next review, click <strong>Update Now</strong> or <strong>Edit</strong> to bring the SOP up to the latest template. Existing content carries over. New sections appear empty for you to fill in.</p>
      </Section>

      <Section title="Archiving and Restoring">
        <p><strong>Archive</strong> moves the SOP and its metadata into an Archive subfolder within the category folder in Google Drive. The SOP is hidden from the main list but not deleted.</p>
        <p><strong>Restore</strong> moves the files back to the original folder and makes the SOP visible again.</p>
      </Section>

      <Section title="Reclassifying">
        <p>Click <strong>Reclassify</strong> in the action bar to change an SOP's category. Select the new category from the dropdown. Files are moved to the new category folder in Google Drive automatically.</p>
      </Section>

      <Section title="Discarding a Draft">
        <p>Draft SOPs that have not been published can be permanently deleted by clicking <strong>Discard</strong>. This removes the SOP from the index and deletes the files from Google Drive. This action cannot be undone.</p>
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
      a: 'Each SOP has a review cadence set during creation (default: Quarterly). When a review is due, a banner appears on the SOP page. Use the Reviews page in the navigation to see all upcoming and overdue reviews. After reviewing, click Mark Review Complete.',
    },
    {
      q: 'What happens when the template is updated?',
      a: 'A blue "Template Updated" banner appears on SOPs created with an older template version. During your next review, click Update Now to bring the SOP up to date. Your existing content is preserved. New sections appear empty for you to fill in.',
    },
    {
      q: 'What file types can I upload?',
      a: 'You can upload .docx, .html, .htm, .txt, and .md files when creating a new SOP. The content is extracted and saved as the SOP body. For best results, use the Copy Prompt workflow to generate formatted content from your AI.',
    },
    {
      q: 'Where do I find the Review Calendar?',
      a: 'Click "Reviews" in the top navigation bar. The dashboard shows all active SOPs with their review status, filterable by owner and business unit. Use "My SOPs" to see only the SOPs you own.',
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
