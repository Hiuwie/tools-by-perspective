import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSeo } from '../hooks/useSeo';


function Home() {
  useSeo({
    title: 'PDF Tools Home',
    description:
      'Perspective POV Tools: free browser-based PDF tools to organize, reorder, rotate, sign, and export documents fast.',
    path: '/',
  });

  return (
    <div className="app-container">
      <Header />

      <main>
        <section className="hero hero-featured">
          <div className="inner">
            <h1>
              Perspective POV Tools
             <img src="Illustrations/DevPenTool.svg" alt="Tools Illustration" className="hero-illustration" />
            </h1>
            <p>
              Free, browser-based tools designed to reduce friction and help you get everyday tasks
              done faster. No sign-ups. No unnecessary steps.
            </p>
            <div className="subtle">Available tools</div>
          </div>
        </section>

        <section className="tools-section">
          <div className="inner">
            <div className="tools-grid" aria-label="available-tools">
              <div>
                <Link to="/pdf-workspace" className="tool-card" style={{textDecoration:'none'}}>
                 
                 <div className="icon-header">
                  <div className="thumb">
                    <img src="Icons/PDFIcon.svg" alt="" />
                  </div>
                  <h3>PDF Workspace</h3>
                 </div>
                  

                  <p>
                    Organsie, sign and manage PDF pages in a single workspace, upload once and export once.
                  </p>
                  <div className="open-link">open workplace →</div>
                </Link>
              </div>

              <div>
                <div className="tool-card" style={{opacity:0.5}}>
                   <div className="icon-header">
                  <div className="thumb" />
                  <h3>More tools comming soon...</h3>
                 </div>
                  <p>Image tools, business utilities, and more.</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
