const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/i18n/en.json');
const kmPath = path.join(__dirname, 'src/i18n/km.json');

const addEducation = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  if (!data.admin) data.admin = {};
  
  // Clone experience but replace words
  data.admin.education = {
    workspace: {
      eyebrow: "Education workspace",
      title: "Keep your degrees, certificates, and academic history easy to manage.",
      description: "Search by degree or school, add new education quickly, and keep the public academic story polished.",
      summaryAria: "Education workspace summary",
      searchPlaceholder: "Search education by degree or school...",
      addNew: "Add New Education",
      timelineHint: "Use precise years so the public timeline stays consistent.",
      presentHint: "Mark current degrees as present."
    },
    table: {
      present: "Present",
      noTimeline: "Timeline not set",
      noDescription: "No description added yet.",
      columns: {
        degree: "Degree",
        timeline: "Timeline",
        status: "Status",
        actions: "Actions"
      },
      degreeMeta: {
        untitled: "Untitled degree",
        noschool: "School not set"
      },
      status: {
        current: "Current",
        completed: "Completed",
        visible: "Visible",
        hidden: "Hidden",
        isCurrent: "Current",
        visibleDesc: "Appears on the public education timeline",
        hiddenDesc: "Saved only in admin for now"
      },
      empty: {
        title: "No Education Entries",
        description: "Add your first degree or certificate.",
        action: "Create first entry"
      }
    },
    form: {
      languages: {
        en: "English",
        km: "Khmer"
      },
      fields: {
        schoolName: "School Name",
        schoolRequired: "English school name is required",
        schoolPlaceholderEn: "e.g. University of Example",
        schoolPlaceholderKm: "ឧ. សាកលវិទ្យាល័យឧទាហរណ៍",
        degree: "Degree / Certificate",
        degreeRequired: "English degree is required",
        degreePlaceholderEn: "e.g. Bachelor of Science",
        degreePlaceholderKm: "ឧ. បរិញ្ញាបត្រវិទ្យាសាស្ត្រ",
        fieldOfStudy: "Field of Study",
        fieldOfStudyPlaceholderEn: "e.g. Computer Science",
        fieldOfStudyPlaceholderKm: "ឧ. វិទ្យាសាស្ត្រកុំព្យូទ័រ",
        description: "Description",
        startYear: "Start Year",
        startYearRequired: "Start year is required",
        isCurrent: "This education is current",
        endYear: "End Year",
        endYearRequired: "End year is required",
        visibility: "Visibility",
        optionVisible: "Visible on Homepage",
        optionHidden: "Hidden from Public"
      },
      sections: {
        degreeDetails: {
          title: "Degree details",
          description: "Use EN/KM tabs to maintain bilingual education entries in one record."
        },
        timeline: {
          title: "Timeline",
          description: "Set education duration accurately."
        },
        visibility: {
          title: "Visibility",
          description: "Control whether this education appears publicly or remains admin-only."
        }
      },
      dialogs: {
        addTitle: "Add New Education",
        editTitle: "Edit Education",
        description: "Keep each entry bilingual in one document. English is required, Khmer is optional."
      },
      actions: {
        cancel: "Cancel",
        saving: "Saving...",
        save: "Save Education"
      }
    },
    messages: {
      created: "Education record created successfully.",
      updated: "Education record updated successfully.",
      deleted: "Education record removed permanently.",
      shownOnHomepage: "Education is now visible on the public site.",
      hiddenOnHomepage: "Education is now hidden from the public site."
    },
    stats: {
      total: {
        label: "Total Education",
        hint: "All education entries in the collection"
      },
      visible: {
        label: "Visible",
        hint: "Shown in the public education section"
      },
      schools: {
        label: "Schools",
        hint: "Distinct institutions represented here"
      },
      currentRoles: {
        label: "Current Education",
        hint: "Entries marked as present"
      }
    },
    dialogs: {
      deleteTitle: "Delete Education Entry?",
      deleteMessage: "Are you sure you want to remove this education? This action cannot be undone."
    }
  };
  
  if (!data.education) {
    data.education = {
        title: "Education",
        empty: "No education records to display yet."
    };
  }

  // Also add to admin.tabs
  if (data.admin.tabs) {
      data.admin.tabs.education = "Education";
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

addEducation(enPath);
addEducation(kmPath);
console.log("Done updating json files.");
