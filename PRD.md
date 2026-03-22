# Planning Guide

A professional web application for music label managers to automate artist sales statements by importing revenue data from multiple sources, applying custom business rules, and generating polished PDF and Excel reports.


1. **Efficient** - Streamline complex multi-step workflows with clear visual hierarchy and logical progression from data import to final export
2. **Trustworthy** - Present financial data with clarity and precision, using professional design patterns that inspire confidence in calculations
3. **Sophisticated** - Reflect the premium nature of music industry business operations through refined aesthetics and attention to detail

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This tool manages multi-source data imports, complex filtering rules, artist mappings, fee calculations, and generates multiple export formats. It requires state management across multiple configuration steps and real-time calculation displays.

- **Trigger**: User c

### 3. Artist Featuring Resol
- **Functionality**: Accepts multiple CSV files from Believe (6-month exports) and Bandcamp revenue sources via drag-and-drop
- **Purpose**: Consolidate revenue data from multiple platforms and time periods for comprehensive annual statements
- **Trigger**: User drags files into designated drop zones or clicks to browse
- **Functionality**: Define percentage-based revenue splits for each artist/band
- **Trigger**: User navigates to split fee settings or adds new artist entry

### 5. Manual Revenue Entry
- **Purpose**: Include non-CSV revenue sources in comprehensive artist statements
- **Progression**: Click add → Input form appears → Enter description and amount → Select artist 

- **Functionality**: Upload label logo and enter business information (name, address) for statement documents
- **Trigger**: User clicks settings/branding section or uploads logo file

### 7. Artist Revenue Dashboard
- **Purpose**: Provide final verification of calculations before generating statements
- **Progression**: Data imported → Rules applied → Calculations processed → Dashboard updates → Displa

- **Functionality**: Generate individual or bulk downloads of artist statements in PDF and Excel formats
- **Trigger**: User clicks "Download All" or individual artist download buttons

## Edge Case Handling
- **Functionality**: Define percentage-based revenue splits for each artist/band
- **Purpose**: Calculate accurate payment amounts based on contractual revenue share agreements
- **Trigger**: User navigates to split fee settings or adds new artist entry
- **Progression**: Select artist → Enter percentage (0-100) → Save → Percentage displayed in artist row → Applied to calculations
- **Success criteria**: Revenue calculations reflect correct split percentages for each artist

### 5. Manual Revenue Entry
- **Functionality**: Add custom revenue entries per artist (e.g., merchandise sales like "Darkmerch")
- **Purpose**: Include non-CSV revenue sources in comprehensive artist statements
- **Trigger**: User clicks "Add Manual Entry" for specific artist
- **Progression**: Click add → Input form appears → Enter description and amount → Select artist → Save → Entry appears in artist's revenue breakdown
- **Success criteria**: Manual entries correctly added to artist totals and visible in final statements

### 6. Label Branding Configuration
- **Functionality**: Upload label logo and enter business information (name, address) for statement documents
- **Purpose**: Generate professionally branded PDF statements with label identity
- **Trigger**: User clicks settings/branding section or uploads logo file
- **Progression**: Navigate to branding → Upload logo → Enter label name, address fields → Save → Preview confirmation
- **Success criteria**: Logo and information correctly displayed in generated PDF statements

### 7. Artist Revenue Dashboard
- **Functionality**: Display calculated revenue totals per artist in sortable table with breakdown details
- **Purpose**: Provide final verification of calculations before generating statements
- **Trigger**: Automatic calculation after data import and configuration
- **Progression**: Data imported → Rules applied → Calculations processed → Dashboard updates → Display artist totals with expandable details
- **Success criteria**: Accurate totals displayed with ability to drill down into revenue sources

### 8. Statement Export System
- **Functionality**: Generate individual or bulk downloads of artist statements in PDF and Excel formats
- **Purpose**: Deliver finalized statements to artists and maintain label records
- **Trigger**: User clicks "Download All" or individual artist download buttons
- **Progression**: Click download → Processing indicator → ZIP file generated (bulk) or file downloaded (individual) → Success notification
- **Success criteria**: PDF and Excel files contain accurate data, proper formatting, and label branding
- **Implementation**: 
  - PDF export: Uses jsPDF to generate professional artist statements with label branding, revenue summary, and transaction details
  - Excel export: Uses XLSX to create comprehensive spreadsheets with Summary and Transaction sheets
  - Bulk export: Uses JSZip to package all statements (both PDF and Excel) into a single downloadable ZIP file
  - All exports include label information, artist details, revenue breakdowns, and complete transaction listings

## Edge Case Handling
- **Empty CSV files**: Display warning message and prevent processing until valid data provided
- **Duplicate uploads**: Detect and warn user before overwriting existing data with option to merge or replace
- **Invalid percentage values**: Validate split fees are 0-100 and show inline error for invalid entries
- **Missing artist mappings**: Display unmapped featuring credits with suggestion to add mappings
- **Zero revenue artists**: Include in dashboard with clear zero-state indication, exclude from exports by default with toggle option
- **Logo file size/format**: Validate image uploads (max 5MB, PNG/JPG/SVG) with clear error messaging
- **Calculation errors**: Display error states with actionable messages if data cannot be processed

## Design Direction
The design should evoke professionalism, precision, and creative sophistication - blending the analytical rigor of financial software with the artistic character of the music industry. The interface should feel like a premium business tool that respects both the numbers and the creative work they represent.

## Color Selection
A bold, modern palette inspired by music industry aesthetics - deep purples and electric accents on a refined neutral base, creating visual energy while maintaining professional credibility.

- **Primary Color**: Deep Purple (oklch(0.45 0.18 295)) - Communicates creativity, premium quality, and music industry sophistication
  - **Tabs**: Convert to
  - Charcoal (oklch(0.25 0.01 270)) for backgrounds and structural elements
  - **Dashboard actions**: Stack download buttons vertically, make "D
- **Accent Color**: Electric Violet (oklch(0.65 0.25 300)) - High-energy highlight for CTAs, active states, and important actions

  - Primary Purple (oklch(0.45 0.18 295)): White text (oklch(0.98 0 0)) - Ratio 8.2:1 ✓

  - Charcoal Background (oklch(0.25 0.01 270)): White text (oklch(0.98 0 0)) - Ratio 12.8:1 ✓


## Font Selection
Typography should balance technical precision with creative personality - a sophisticated geometric sans for headings paired with a highly legible interface font for data-heavy sections.

- **Typographic Hierarchy**:

  - **H2 (Subsection Headers)**: Space Grotesk Semibold / 24px / -0.01em letter spacing

  - **Body Text**: Inter Regular / 15px / line-height 1.6
  - **Table Data**: JetBrains Mono Regular / 14px / Monospaced for numerical alignment
  - **Labels**: Inter Medium / 13px / uppercase / 0.05em letter spacing / muted color



Animations should provide functional clarity while adding moments of refined delight - fluid transitions for workflow progression, satisfying feedback for data operations, and smooth state changes that maintain context.

- **File upload**: Smooth scale and fade-in for file items with stagger effect (150ms delay per item)
- **Data processing**: Subtle pulse animation on calculation indicators, smooth progress bars
- **Tab/section transitions**: 300ms ease-in-out slide with slight fade

- **List item additions**: Slide-down entrance with 250ms spring animation

- **Form validation**: Shake animation (300ms) for errors, smooth color transition for valid states
- **Dashboard updates**: Counting animation for revenue totals (800ms) when data changes




  - **Card**: Primary container for each major section (Upload, Configuration, Dashboard) with subtle shadow and border
  - **Tabs**: Navigate between major workflow sections (Import → Configure → Review → Export)
  - **Dialog**: Artist mapping input, manual revenue entry, compilation exclusion forms
  - **Table**: Revenue dashboard with sortable columns, expandable rows for breakdown details
  - **Input**: Text fields for EAN/UPC, catalog numbers, artist names, label information

  - **Badge**: Status indicators (uploaded, processed, excluded), file type tags
  - **Dropdown Menu**: Per-artist action menus (download PDF, download Excel, edit, delete)
  - **Progress**: File upload progress, calculation processing indicators
  - **Alert**: Validation messages, warnings for missing mappings or configuration
  - **Separator**: Visual division between configuration sections



  - **Drag-drop zones**: Custom component with dashed border, upload icon, animated hover state showing purple accent glow
  - **Artist split fee input**: Combined component with artist selector and percentage slider/input with real-time validation
  - **Revenue breakdown cards**: Custom expandable cards showing aggregated totals with drill-down into sources (Believe, Bandcamp, Manual)
  - **Logo upload preview**: Custom component showing uploaded image with edit/remove actions and dimension guidelines
  - **File list items**: Custom design showing filename, size, type badge, upload progress, remove button

- **States**:




































