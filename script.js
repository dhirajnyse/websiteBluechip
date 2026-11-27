
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

function setNavigation(open) {
  if (!navToggle || !siteNav) return;

  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");

  siteNav.classList.toggle("is-open", open);
  document.body.classList.toggle("nav-open", open);
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setNavigation(!isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavigation(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setNavigation(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      setNavigation(false);
    }
  });
}

const reveals = document.querySelectorAll(".reveal:not(.is-visible)");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -8%",
      threshold: 0.08
    }
  );

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => {
    element.classList.add("is-visible");
  });
}

const promoVideo = document.querySelector("#promo-video");

if (promoVideo) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const saveData = Boolean(
    navigator.connection && navigator.connection.saveData
  );

  let observerAction = false;
  let userPaused = false;

  promoVideo.addEventListener("pause", () => {
    if (!observerAction) userPaused = true;
  });

  promoVideo.addEventListener("play", () => {
    if (!observerAction) userPaused = false;
  });

  if (!reducedMotion && !saveData && "IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            if (promoVideo.paused && !userPaused) {
              observerAction = true;

              promoVideo.play().catch(() => {}).finally(() => {
                observerAction = false;
              });
            }
          } else if (!promoVideo.paused) {
            observerAction = true;
            promoVideo.pause();

            window.setTimeout(() => {
              observerAction = false;
            }, 0);
          }
        });
      },
      {
        threshold: [0, 0.35, 0.75]
      }
    );

    videoObserver.observe(promoVideo);
  }
}

const quoteForm = document.querySelector("#quote-form");
const blueprintInput = document.querySelector("#blueprint");
const fileName = document.querySelector("#file-name");
const formStatus = document.querySelector("#form-status");
const quotePackage = document.querySelector("#quote-package");
const quotePackageFile = document.querySelector("#quote-package-file");
const emailDraftButton = document.querySelector("#email-draft-button");
const sharePdfButton = document.querySelector("#share-pdf-button");
const sharePdfGuidance = document.querySelector("#share-pdf-guidance");
const quotePackageGuidance = document.querySelector(".quote-package-guidance");
const downloadPdfButton = document.querySelector("#download-pdf-button");

const quoteRecipient = "info@bluechipspc.com";
const bluechipLogoPath = "assets/bluechip-logo-pdf.png";

let preparedQuotePackage = null;

if (blueprintInput && fileName) {
  blueprintInput.addEventListener("change", () => {
    const selectedFile = blueprintInput.files && blueprintInput.files[0];

    fileName.textContent = selectedFile
      ? selectedFile.name
      : "Choose a PDF, Excel, Word, CAD, or image file";
  });
}

function cleanValue(data, key) {
  const value = data.get(key);

  return typeof value === "string" && value.trim()
    ? value.trim()
    : "Not provided";
}

function safeFilePart(value) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "Company";
}

function formatDeliveryDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

async function loadLogoAsPng() {
  let response;

  try {
    response = await fetch(bluechipLogoPath, {
      cache: "no-cache"
    });
  } catch (error) {
    throw new Error(
      "Unable to load the Bluechip logo. Open the website using Live Server in VS Code."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Bluechip logo not found. Check that ${bluechipLogoPath} exists in your project.`
    );
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the Bluechip PDF logo."));
    };

    reader.readAsDataURL(blob);
  });
}

function buildQuoteEmail(data, selectedFile, pdfFileName) {
  const company = cleanValue(data, "company");
  const category = cleanValue(data, "product_category");

  const subject = `Industrial RFQ | ${company} | ${category}`;

  const body = [
    "Dear Bluechip Engineering Team,",
    "",
    "Please review our industrial product enquiry.",
    "",
    "COMPANY AND CONTACT INFORMATION",
    `Contact Name: ${cleanValue(data, "contact_name")}`,
    `Company: ${company}`,
    `Business Email: ${cleanValue(data, "email")}`,
    `Phone: ${cleanValue(data, "phone")}`,
    "",
    "PRODUCT REQUIREMENTS",
    `Product Category: ${category}`,
    `Preferred Brand: ${cleanValue(data, "preferred_brand")}`,
    `Enquiry Type: ${cleanValue(data, "enquiry_type")}`,
    `Required Quantity: ${cleanValue(data, "quantity")}`,
    `Product Model / Part Number: ${cleanValue(data, "product_reference")}`,
    `Project / RFQ Reference: ${cleanValue(data, "project_reference")}`,
    "",
    "PRODUCT DESCRIPTION AND SPECIFICATIONS",
    cleanValue(data, "product_description"),
    "",
    "DELIVERY AND DOCUMENTATION",
    `Delivery Location: ${cleanValue(data, "delivery_location")}`,
    `Required Delivery Date: ${formatDeliveryDate(cleanValue(data, "timeline"))}`,
    `Certification Requirements: ${cleanValue(data, "certification_requirements")}`,
    `Additional Requirements: ${cleanValue(data, "message")}`,
    "",
    `RFQ PDF to attach: ${pdfFileName}`,
    selectedFile
      ? `Supporting document to attach: ${selectedFile.name}`
      : "No supporting document selected.",
    "",
    "Please find the generated RFQ PDF attached for your review.",
    "",
    "Kind regards,",
    cleanValue(data, "contact_name"),
    company
  ].join("\n");

  return {
    subject,
    body
  };
}

function createQuotePdf(data, selectedFile, logoDataUrl) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error(
      "PDF generator is unavailable. Check the jsPDF library in quote-contact.html."
    );
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const charcoal = [23, 27, 31];
  const navy = [23, 52, 80];
  const slate = [93, 104, 113];
  const orange = [242, 100, 34];
  const lightGray = [222, 226, 230];

  const now = new Date();

  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const localTime =
    `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  const reference = `BCRFQ-${localDate.replaceAll("-", "")}-${localTime}`;

  const company = cleanValue(data, "company");

  const pdfFileName =
    `Bluechip-RFQ-${safeFilePart(company)}-${localDate}.pdf`;

  let y = 0;

  function drawHeader(firstPage = false) {
    doc.setFillColor(255, 255, 255);

    if (firstPage) {
      doc.rect(0, 0, pageWidth, 53, "F");

      if (!logoDataUrl) {
        throw new Error("The Bluechip logo is required for the RFQ PDF.");
      }

      try {
        const imageProperties = doc.getImageProperties(logoDataUrl);

        const maximumLogoWidth = 37;
        const maximumLogoHeight = 25;

        const naturalRatio =
          imageProperties.width / imageProperties.height;

        let logoWidth = maximumLogoWidth;
        let logoHeight = logoWidth / naturalRatio;

        if (logoHeight > maximumLogoHeight) {
          logoHeight = maximumLogoHeight;
          logoWidth = logoHeight * naturalRatio;
        }

        const logoX = margin;
        const logoY = 10 + (maximumLogoHeight - logoHeight) / 2;

        doc.addImage(
          logoDataUrl,
          "PNG",
          logoX,
          logoY,
          logoWidth,
          logoHeight,
          undefined,
          "FAST"
        );
      } catch (error) {
        throw new Error(
          "The Bluechip PDF logo could not be inserted. Check that bluechip-logo-pdf.png is a valid PNG image."
        );
      }

      doc.setTextColor(...navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);

      doc.text(
        "BLUECHIP",
        margin + 42,
        18
      );

      doc.setTextColor(...charcoal);
      doc.setFontSize(10);

      doc.text(
        "ENGINEERING",
        margin + 42,
        25
      );

      doc.setTextColor(...slate);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.7);

      doc.text(
        "Industrial Products Distribution",
        margin + 42,
        31
      );

      doc.text(
        "& Supply Solutions",
        margin + 42,
        35
      );

      doc.setTextColor(...orange);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);

      doc.text(
        "INDUSTRIAL RFQ",
        pageWidth - margin,
        15,
        {
          align: "right"
        }
      );

      doc.setTextColor(...charcoal);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      doc.text(
        "REQUEST FOR QUOTATION",
        pageWidth - margin,
        22,
        {
          align: "right"
        }
      );

      doc.text(
        reference,
        pageWidth - margin,
        29,
        {
          align: "right"
        }
      );

      doc.setTextColor(...slate);

      doc.text(
        quoteRecipient,
        pageWidth - margin,
        36,
        {
          align: "right"
        }
      );

      doc.setDrawColor(...orange);
      doc.setLineWidth(1.1);

      doc.line(
        margin,
        45,
        pageWidth - margin,
        45
      );

      y = 56;

      return;
    }

    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    doc.text(
      "BLUECHIP ENGINEERING",
      margin,
      13
    );

    doc.setTextColor(...slate);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      "INDUSTRIAL RFQ",
      pageWidth - margin,
      13,
      {
        align: "right"
      }
    );

    doc.setDrawColor(...orange);
    doc.setLineWidth(0.8);

    doc.line(
      margin,
      21,
      pageWidth - margin,
      21
    );

    y = 32;
  }

  function newPage() {
    doc.addPage();
    drawHeader();
  }

  function ensureSpace(requiredHeight) {
    if (y + requiredHeight > pageHeight - 22) {
      newPage();
    }
  }

  function addSection(title) {
    ensureSpace(17);

    y += 4;

    doc.setDrawColor(...orange);
    doc.setLineWidth(1.1);

    doc.line(
      margin,
      y,
      margin + 8,
      y
    );

    doc.setTextColor(...charcoal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text(
      title.toUpperCase(),
      margin + 12,
      y + 1.2
    );

    y += 12;
  }

  function addPair(leftLabel, leftValue, rightLabel, rightValue) {
    const gap = 10;
    const columnWidth = (contentWidth - gap) / 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const leftLines = doc.splitTextToSize(
      String(leftValue),
      columnWidth
    );

    const rightLines = doc.splitTextToSize(
      String(rightValue),
      columnWidth
    );

    const lineCount = Math.max(
      leftLines.length,
      rightLines.length
    );

    ensureSpace(12 + lineCount * 4.5);

    doc.setTextColor(...slate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    doc.text(
      leftLabel.toUpperCase(),
      margin,
      y
    );

    doc.text(
      rightLabel.toUpperCase(),
      margin + columnWidth + gap,
      y
    );

    doc.setTextColor(...charcoal);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      leftLines,
      margin,
      y + 5
    );

    doc.text(
      rightLines,
      margin + columnWidth + gap,
      y + 5
    );

    y += 12 + lineCount * 4.5;
  }

  function addBlock(label, value) {
    ensureSpace(18);

    doc.setTextColor(...slate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    doc.text(
      label.toUpperCase(),
      margin,
      y
    );

    y += 6;

    doc.setTextColor(...charcoal);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    const lines = doc.splitTextToSize(
      String(value),
      contentWidth
    );

    let index = 0;

    while (index < lines.length) {
      if (y > pageHeight - 26) {
        newPage();
      }

      const available = Math.max(
        1,
        Math.floor((pageHeight - 24 - y) / 4.8)
      );

      const part = lines.slice(
        index,
        index + available
      );

      doc.text(
        part,
        margin,
        y
      );

      y += part.length * 4.8;
      index += part.length;

      if (index < lines.length) {
        newPage();
      }
    }

    y += 6;
  }

  drawHeader(true);

  addPair(
    "RFQ Reference",
    reference,
    "Prepared",
    now.toLocaleString("en-GB")
  );

  addSection("Company and Contact");

  addPair(
    "Contact Name",
    cleanValue(data, "contact_name"),
    "Company",
    company
  );

  addPair(
    "Business Email",
    cleanValue(data, "email"),
    "Phone Number",
    cleanValue(data, "phone")
  );

  addSection("Product and Procurement Requirements");

  addPair(
    "Product Category",
    cleanValue(data, "product_category"),
    "Preferred Brand",
    cleanValue(data, "preferred_brand")
  );

  addPair(
    "Enquiry Type",
    cleanValue(data, "enquiry_type"),
    "Required Quantity",
    cleanValue(data, "quantity")
  );

  addPair(
    "Model / Part Number",
    cleanValue(data, "product_reference"),
    "Project / RFQ Reference",
    cleanValue(data, "project_reference")
  );

  addBlock(
    "Product Description and Technical Specifications",
    cleanValue(data, "product_description")
  );

  addSection("Delivery and Commercial Requirements");

  addPair(
    "Delivery Location",
    cleanValue(data, "delivery_location"),
    "Required Delivery Date",
    formatDeliveryDate(cleanValue(data, "timeline"))
  );

  addBlock(
    "Documentation and Certification Requirements",
    cleanValue(data, "certification_requirements")
  );

  addBlock(
    "Additional Requirements and Notes",
    cleanValue(data, "message")
  );

  addSection("Supporting Documents");

  addBlock(
    "Selected File",
    selectedFile
      ? selectedFile.name
      : "No supporting file selected"
  );

  addBlock(
    "Attachment Instruction",
    "The selected supporting document is not embedded in this PDF. Attach it separately to your email to Bluechip Engineering."
  );

  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);

    doc.line(
      margin,
      pageHeight - 14,
      pageWidth - margin,
      pageHeight - 14
    );

    doc.setTextColor(...slate);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    doc.text(
      "Bluechip Engineering & Contracting LLC | bluechipspc.com",
      margin,
      pageHeight - 8
    );

    doc.text(
      `Page ${page} of ${pages}`,
      pageWidth - margin,
      pageHeight - 8,
      {
        align: "right"
      }
    );
  }

  return {
    doc,
    fileName: pdfFileName
  };
}

function downloadPdf(blob, name) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = name;

  document.body.appendChild(link);

  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

function setQuoteStatus(message, isError = false) {
  if (!formStatus) return;

  formStatus.textContent = message;
  formStatus.classList.toggle("error", isError);
}

function openPreparedEmail() {
  if (!preparedQuotePackage) return;

  const {
    pdfBlob,
    pdfFileName,
    subject,
    body,
    selectedFile
  } = preparedQuotePackage;

  downloadPdf(pdfBlob, pdfFileName);

  setQuoteStatus(
    `RFQ PDF downloaded. Attach ${pdfFileName}${selectedFile ? ` and ${selectedFile.name}` : ""} to the email draft before sending.`
  );

  window.setTimeout(() => {
    window.location.href =
      `mailto:${quoteRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, 300);
}

async function sharePreparedPdf() {
  if (
    !preparedQuotePackage ||
    !preparedQuotePackage.canSharePdf
  ) {
    return;
  }

  setQuoteStatus(
    `Choose an email application and send the RFQ PDF to ${quoteRecipient}. Nothing is sent automatically.`
  );

  try {
    await navigator.share(
      preparedQuotePackage.sharePayload
    );

    setQuoteStatus(
      "The sharing operation was completed. Verify the recipient and whether the email was sent in your selected app."
    );
  } catch (error) {
    if (error && error.name === "AbortError") {
      setQuoteStatus(
        "Sharing was cancelled. No enquiry was submitted through the website."
      );

      return;
    }

    setQuoteStatus(
      "Your device could not share the file. Use Open Addressed Email or Download RFQ PDF instead.",
      true
    );
  }
}

if (emailDraftButton) {
  emailDraftButton.addEventListener(
    "click",
    openPreparedEmail
  );
}

if (sharePdfButton) {
  sharePdfButton.addEventListener(
    "click",
    sharePreparedPdf
  );
}

if (downloadPdfButton) {
  downloadPdfButton.addEventListener("click", () => {
    if (!preparedQuotePackage) return;

    downloadPdf(
      preparedQuotePackage.pdfBlob,
      preparedQuotePackage.pdfFileName
    );

    setQuoteStatus(
      `${preparedQuotePackage.pdfFileName} was downloaded. Nothing was sent.`
    );
  });
}

if (quoteForm) {
  function invalidatePreparedQuote() {
    if (!preparedQuotePackage) return;

    preparedQuotePackage = null;

    if (quotePackage) {
      quotePackage.hidden = true;
    }

    setQuoteStatus(
      "The enquiry has changed. Generate an updated RFQ PDF before continuing."
    );
  }

  quoteForm.addEventListener("input", invalidatePreparedQuote);
  quoteForm.addEventListener("change", invalidatePreparedQuote);

  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!quoteForm.checkValidity()) {
      quoteForm.reportValidity();

      setQuoteStatus(
        "Please complete the required contact and product fields.",
        true
      );

      return;
    }

    const submitButton = quoteForm.querySelector(
      'button[type="submit"]'
    );

    const data = new FormData(quoteForm);

    const selectedFile =
      blueprintInput && blueprintInput.files
        ? blueprintInput.files[0]
        : null;

    if (submitButton) {
      submitButton.disabled = true;
    }

    setQuoteStatus(
      "Preparing your branded Bluechip Engineering RFQ PDF..."
    );

    try {
      const logoDataUrl = await loadLogoAsPng();

      const {
        doc,
        fileName: pdfFileName
      } = createQuotePdf(
        data,
        selectedFile,
        logoDataUrl
      );

      const pdfBlob = doc.output("blob");

      const pdfFile =
        typeof File === "function"
          ? new File(
              [pdfBlob],
              pdfFileName,
              {
                type: "application/pdf"
              }
            )
          : null;

      const {
        subject,
        body
      } = buildQuoteEmail(
        data,
        selectedFile,
        pdfFileName
      );

      const sharePayload = pdfFile
        ? {
            files: [pdfFile],
            title: subject,
            text: body
          }
        : null;

      let canSharePdf = false;

      try {
        canSharePdf =
          Boolean(pdfFile) &&
          typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({
            files: [pdfFile]
          });
      } catch (error) {
        canSharePdf = false;
      }

      preparedQuotePackage = {
        pdfBlob,
        pdfFileName,
        subject,
        body,
        selectedFile,
        sharePayload,
        canSharePdf
      };

      if (quotePackageFile) {
        quotePackageFile.textContent = pdfFileName;
      }

      if (sharePdfButton) {
        sharePdfButton.hidden = !canSharePdf;
      }

      if (sharePdfGuidance) {
        sharePdfGuidance.hidden = !canSharePdf;
      }

      if (quotePackageGuidance) {
        quotePackageGuidance.classList.toggle(
          "is-single",
          !canSharePdf
        );
      }

      if (quotePackage) {
        quotePackage.hidden = false;
      }

      setQuoteStatus(
        "Your branded industrial RFQ PDF is ready. Choose an email or download option. Nothing has been sent."
      );

      if (quotePackage) {
        const behavior = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth";

        quotePackage.scrollIntoView({
          behavior,
          block: "nearest"
        });
      }
    } catch (error) {
      setQuoteStatus(
        error && error.message
          ? error.message
          : "The RFQ PDF could not be generated.",
        true
      );

      console.error("Bluechip RFQ PDF error:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

(function () {
  function initializeBrandSpotlight() {
    const spotlight = document.querySelector(
      ".brand-spotlight"
    );

    if (!spotlight) return;

    const selector = spotlight.querySelector(
      ".brand-selector"
    );

    const panelContainer = spotlight.querySelector(
      ".brand-spotlight-panels"
    );

    if (!selector || !panelContainer) return;

    const tabs = Array.from(
      selector.querySelectorAll(".brand-tab")
    );

    const panels = Array.from(
      panelContainer.querySelectorAll(".brand-detail")
    );

    if (!tabs.length) return;

    const panelById = new Map(
      panels.map((panel) => [
        panel.id,
        panel
      ])
    );

    const rows = [];

    let activeTab = null;

    selector.setAttribute("role", "group");

    panels.forEach((panel) => {
      panel.hidden = true;
      panel.setAttribute("role", "region");
    });

    function closeBrand() {
      tabs.forEach((tab) => {
        tab.classList.remove("is-active");
        tab.setAttribute("aria-expanded", "false");
      });

      panels.forEach((panel) => {
        panel.hidden = true;
      });

      rows.forEach((row) => {
        row.classList.remove("is-open");
      });

      spotlight.classList.remove("is-open");

      activeTab = null;
    }

    tabs.forEach((tab, index) => {
      if (index % 2 === 0) {
        const row = document.createElement("div");

        row.className = "brand-row";

        selector.appendChild(row);
        rows.push(row);
      }

      const row = rows[rows.length - 1];

      const panel = panelById.get(
        tab.getAttribute("aria-controls")
      );

      tab.classList.remove(
        "is-active",
        "brand-left",
        "brand-right"
      );

      tab.classList.add(
        index % 2 === 0
          ? "brand-left"
          : "brand-right"
      );

      tab.removeAttribute("role");
      tab.removeAttribute("aria-selected");
      tab.removeAttribute("tabindex");

      tab.setAttribute("aria-expanded", "false");

      row.appendChild(tab);

      if (!panel) return;

      row.appendChild(panel);

      tab.addEventListener("click", () => {
        const wasOpen = activeTab === tab;

        closeBrand();

        if (wasOpen) return;

        activeTab = tab;

        tab.classList.add("is-active");
        tab.setAttribute("aria-expanded", "true");

        row.classList.add("is-open");
        spotlight.classList.add("is-open");

        panel.hidden = false;
      });
    });

    rows.forEach((row) => {
      row.classList.toggle(
        "is-single",
        row.querySelectorAll(".brand-tab").length === 1
      );
    });

    panelContainer.hidden = true;

    closeBrand();

    spotlight.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !activeTab) return;

      const previousTab = activeTab;

      closeBrand();

      previousTab.focus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeBrandSpotlight
    );
  } else {
    initializeBrandSpotlight();
  }
})();
