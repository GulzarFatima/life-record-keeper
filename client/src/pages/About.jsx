import "@/styles/form.css";
import "@/styles/about.css";

export default function About() {
  return (
    <div className="about-wrap">
      <section className="about-hero">
        <div className="about-kicker">About</div>
        <h1 className="about-title">Life Record Keeper</h1>
        <p className="about-sub">
          Organize Education, Career, and Travel records in one secure place. 
          Add details, save documents, and find what you need quickly at any time.
        </p>
      </section>

      <section className="about-grid">
        <div className="about-card">
          <h3>What it does</h3>
          <ul>
            <li>Create and store education, career, and travel records.</li>
            <li>Attach transcripts, job letters, permits, and travel docs</li>
            <li>Highlight important milestones</li>
            <li>Search/filter (roadmap) and download (coming soon)</li>
          </ul>
        </div>

        <div className="about-card">
          <h3>Why it helps</h3>
          <ul>
            <li>Keep key documents and dates together</li>
            <li>Be ready for applications and renewals</li>
            <li>See your history at a glance</li>
            <li>Private by default — you see only your data</li>
          </ul>
        </div>

        <div className="about-card">
          <h3>Feature highlights</h3>
          <ul>
            <li>Email sign up, verification, and secure login</li>
            <li>Manage records smoothly with clean UI</li>
            <li>Category-aware forms: Education, Career, Travel</li>
            <li>Document previews and counts per record</li>
          </ul>
        </div>

        <div className="about-card">
          <h3>Project note</h3>
          <ul>
            <li>MVP student project; features will evolve</li>
            <li>Built with React, Firebase Auth, and MongoDB</li>
            <li>Feedback is welcome on the Support page</li>
          </ul>
        </div>
      </section>

      <p className="about-foot">
        © {new Date().getFullYear()} Life Record Keeper. Student MVP - for demonstration 
        and learning.
      </p>
    </div>
  );
}
