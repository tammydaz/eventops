import { useEffect } from "react";

const printStyles = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Georgia', serif;
    background-color: #f0f0f0;
    padding: 20px;
}

.back-to-dashboard {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  padding: 8px 14px;
  border-radius: 6px;
  background: #2c2c2c;
  color: #ffffff;
  border: 1px solid #555;
  font-size: 11pt;
  cursor: pointer;
}

.back-to-dashboard:hover {
  border-color: #cc0000;
}

.page-container {
    max-width: 8.5in;
    min-height: 11in;
    background-color: white;
    margin: 0 auto;
    padding: 0;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    border: 3pt solid #999;
}

/* ============= DARK HEADER ============= */
.dark-header {
    background-color: #2c2c2c;
    color: white;
    padding: 0.2in 0.5in;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3pt solid #cc0000;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 0.15in;
}

.foodwerx-logo {
    width: 0.35in;
    height: 0.35in;
    background-color: #cc0000;
    transform: rotate(45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3pt;
}

.foodwerx-logo-letter {
    transform: rotate(-45deg);
    font-weight: bold;
    font-size: 18pt;
    color: white;
    line-height: 1;
}

.foodwerx-text {
    font-family: 'Arial', sans-serif;
    font-size: 16pt;
    font-weight: bold;
    letter-spacing: 1pt;
}

.header-right {
    text-align: right;
}

.header-right-label {
    font-size: 6.5pt;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin-bottom: 2pt;
}

.header-right-value {
    font-size: 11pt;
    font-weight: bold;
}

/* ============= RED SEPARATOR LINE ============= */
.red-line {
    height: 2pt;
    background-color: #cc0000;
}

/* ============= INFO BOX ============= */
.info-box {
    margin: 0.2in 0.5in;
    padding: 0.15in;
    border: 1pt solid #ddd;
    border-radius: 8pt;
  background-color: #eeeeee;
    font-size: 8pt;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.15in;
}

.info-row {
    display: flex;
    gap: 0.05in;
}

.info-label {
    color: #666;
    font-weight: bold;
    min-width: 0.45in;
}

.info-value {
    color: #333;
    font-weight: bold;
}

/* ============= ALLERGY BANNER ============= */
.allergy-banner {
    margin: 0.15in 0.5in;
    padding: 10pt;
    border: 2pt solid #cc0000;
    border-radius: 8pt;
    background-color: #fff5f5;
    text-align: center;
    font-weight: bold;
    font-size: 9pt;
    color: #cc0000;
}

/* ============= CONTENT WRAPPER ============= */
.content-wrapper {
    padding: 0.15in 0.5in;
    flex: 1;
    overflow-y: auto;
}

/* ============= PILL SECTIONS ============= */
.pill-section {
    margin-bottom: 0.2in;
    border-radius: 8pt;
  border: 2pt solid #444;
    padding: 0.15in;
    background-color: #fafafa;
  box-shadow: 0 0 0 1pt #333;
}


.pill-header {
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    margin-bottom: 0.1in;
    padding-bottom: 0.08in;
  border-bottom: 1pt solid #444;
    color: #333;
}

.collapsed .collapse-body {
    display: none;
}

/* ============= MAIN CONTENT TABLE ============= */
.food-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
}

.food-block {
    border-bottom: none;
}

.food-block:nth-child(odd) {
    background-color: transparent;
}

.food-block:nth-child(even) {
    background-color: transparent;
}

.col-specs {
    width: 18%;
    padding: 6pt 6pt;
    font-family: 'Courier New', monospace;
  font-size: 9.5pt;
  font-weight: bold;
    color: #333;
    vertical-align: top;
    line-height: 1.3;
    border-right: none;
}

.col-item {
    width: 50%;
    padding: 6pt 8pt;
    vertical-align: top;
    border-right: none;
}

.col-notes {
    width: 32%;
    padding: 6pt 6pt;
    font-style: italic;
    font-size: 8pt;
    color: #666;
    vertical-align: top;
    line-height: 1.3;
}

.item-name {
    font-size: 9pt;
    font-weight: bold;
    color: #1a1a1a;
    margin-bottom: 1pt;
}

.item-sauce {
    font-size: 8pt;
    color: #333;
    margin-left: 8pt;
    margin-top: 1pt;
    line-height: 1.2;
}

.spec-line {
    margin-bottom: 2pt;
}

/* ============= FOOTER ============= */
.footer {
    margin-top: auto;
    border-top: 1pt solid #ddd;
    padding: 0;
}

.footer-banner {
  padding: 10pt;
  font-weight: bold;
  font-size: 9pt;
  text-align: center;
  border: 2pt solid #cc0000;
  border-radius: 8pt;
  background-color: #fff5f5;
  color: #cc0000;
}

.footer-summary {
    background-color: #f0f0f0;
    padding: 10pt 0.5in;
    font-size: 7.5pt;
    color: #333;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-weight: bold;
  border-radius: 9999px;
}

.footer-item {
    flex: 1;
    text-align: center;
    padding: 0 4pt;
}

.footer-item-label {
    color: #999;
    font-weight: bold;
    font-size: 6pt;
    text-transform: uppercase;
    letter-spacing: 0.2pt;
    margin-bottom: 1pt;
}

.footer-item-value {
    color: #333;
    font-weight: bold;
    font-size: 8pt;
}

/* Print styles */
@media print {
    body {
        background-color: white;
        padding: 0;
    }

  .back-to-dashboard {
    display: none !important;
  }

    .page-container {
        box-shadow: none;
        max-width: 100%;
        height: auto;
        margin: 0;
      min-height: 11.5in;
    }

    .collapsed .collapse-body {
        display: block !important;
    }

    .footer { display: none !important; }
    .page-container:last-of-type .footer { display: block !important; }

    .pill-section {
      page-break-inside: avoid;
      break-inside: avoid;
    }
}
`;

export const PrintTest = () => {
  useEffect(() => {
    const headers = Array.from(document.querySelectorAll<HTMLDivElement>(".pill-header"));
    const handleClick = (event: Event) => {
      const target = event.currentTarget as HTMLDivElement | null;
      if (!target || !target.parentElement) return;
      target.parentElement.classList.toggle("collapsed");
    };

    headers.forEach((header) => header.addEventListener("click", handleClick));

    return () => {
      headers.forEach((header) => header.removeEventListener("click", handleClick));
    };
  }, []);

  return (
    <>
      <style>{printStyles}</style>
      <button
        type="button"
        className="back-to-dashboard"
        onClick={() => {
          window.location.href = "/";
        }}
      >
        ← Back to Dashboard
      </button>
      <div className="page-container">
        <div className="dark-header">
          <div className="header-left">
            <div className="foodwerx-logo">
              <div className="foodwerx-logo-letter">f</div>
            </div>
            <div className="foodwerx-text">foodwerx</div>
          </div>
          <div className="header-right">
            <div className="header-right-label">Job # / Dispatch</div>
            <div className="header-right-value">Job #: 2026-0847  |  5:30 PM</div>
          </div>
        </div>

        <div className="red-line"></div>

        <div className="info-box">
          <div className="info-row">
            <div className="info-label">Client:</div>
            <div className="info-value">The Gilded Table</div>
          </div>
          <div className="info-row">
            <div className="info-label">Date:</div>
            <div className="info-value">Feb 15, 2026</div>
          </div>
          <div className="info-row">
            <div className="info-label">Contact:</div>
            <div className="info-value">—</div>
          </div>
          <div className="info-row">
            <div className="info-label">Guests:</div>
            <div className="info-value">125</div>
          </div>
          <div className="info-row">
            <div className="info-label">Phone:</div>
            <div className="info-value">(888) 555-4545</div>
          </div>
          <div className="info-row">
            <div className="info-label">Dispatch:</div>
            <div className="info-value">5:30 PM</div>
          </div>
          <div className="info-row" style={{ gridColumn: "1 / -1" }}>
            <div className="info-label">Venue:</div>
            <div className="info-value">Riverside Manor, Grand Ballroom</div>
          </div>
        </div>

        <div className="allergy-banner">⚠️ ALLERGIES / DIETARY RESTRICTIONS: Shellfish</div>

        <div className="content-wrapper">
          <div className="pill-section pill-passed">
            <div className="pill-header">Passed Appetizers</div>
            <div className="collapse-body">
              <table className="food-table">
                <tbody>
                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">2 oz</div>
                      <div className="spec-line">3 Full Pans</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Sesame Chicken on Bamboo</div>
                      <div className="item-sauce">Ginger Sesame Dip (½ Pint)</div>
                    </td>
                    <td className="col-notes">Keep warm, pass with napkins</td>
                  </tr>

                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">1.5 oz ea</div>
                      <div className="spec-line">2 Full Pans</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Polpetti (Italian Meatballs)</div>
                      <div className="item-sauce">Marinara Sauce (¾ Pint)</div>
                    </td>
                    <td className="col-notes">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pill-section pill-presented">
            <div className="pill-header">Presented Appetizers</div>
            <div className="collapse-body">
              <table className="food-table">
                <tbody>
                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">2 oz</div>
                      <div className="spec-line">3 Full Pans</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Crab Cakes</div>
                      <div className="item-sauce">Chipotle Aioli (½ Pint)</div>
                    </td>
                    <td className="col-notes">Arrange on platters nicely</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pill-section pill-buffet-metal">
            <div className="pill-header">Buffet – Metal</div>
            <div className="collapse-body">
              <table className="food-table">
                <tbody>
                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">2 Full Pans</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Mac &amp; Cheese</div>
                    </td>
                    <td className="col-notes">Pack one dairy-free</td>
                  </tr>

                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">3 Full Pans</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Bruschetta Chicken</div>
                    </td>
                    <td className="col-notes">Display under heat lamp</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pill-section pill-buffet-china">
            <div className="pill-header">Buffet – China</div>
            <div className="collapse-body">
              <table className="food-table">
                <tbody>
                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">2 Full Pans</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Roasted Vegetables</div>
                      <div className="item-sauce">Balsamic Glaze (¼ Pint)</div>
                    </td>
                    <td className="col-notes">Keep warm in bowl</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pill-section pill-dessert">
            <div className="pill-header">Desserts</div>
            <div className="collapse-body">
              <table className="food-table">
                <tbody>
                  <tr className="food-block">
                    <td className="col-specs">
                      <div className="spec-line">36 Count</div>
                    </td>
                    <td className="col-item">
                      <div className="item-name">Chocolate Truffles</div>
                    </td>
                    <td className="col-notes">Individual boxes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="footer">
          <div className="footer-banner">🚨 ALLERGIES / DIETARY RESTRICTIONS: Shellfish</div>
          <div className="footer-summary">
            <div className="footer-item">
              <div className="footer-item-label">Client</div>
              <div className="footer-item-value">The Gilded Table</div>
            </div>
            <div className="footer-item">
              <div className="footer-item-label">Venue</div>
              <div className="footer-item-value">Riverside Manor</div>
            </div>
            <div className="footer-item">
              <div className="footer-item-label">Dispatch</div>
              <div className="footer-item-value">5:30 PM</div>
            </div>
            <div className="footer-item">
              <div className="footer-item-label">Guests</div>
              <div className="footer-item-value">125</div>
            </div>
            <div className="footer-item">
              <div className="footer-item-label">Job #</div>
              <div className="footer-item-value">2026-0847</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
