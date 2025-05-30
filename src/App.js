import { useState, useEffect } from "react";

export default function App() {
  const defaultGuitarStrings = ["e|", "B|", "G|", "D|", "A|", "E|"];
  const defaultBassStrings = ["G|", "D|", "A|", "E|"];

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const generateRow = (stringLabels) =>
    stringLabels
      .map(label => `${label}${"-".repeat(isMobile ? 36 : 50)}`)
      .join("\n");

  const [tabData, setTabData] = useState(() => {
    const saved = localStorage.getItem("tabData");
    return saved
      ? JSON.parse(saved)
      : {
          guitar: { title: "Guitar", content: generateRow(defaultGuitarStrings) },
          bass: { title: "Bass", content: generateRow(defaultBassStrings) },
        };
  });

  const [instrument, setInstrument] = useState("guitar");
  const [tabName, setTabName] = useState(() => localStorage.getItem("tabName") || "My Tab");
  const [savedTabs, setSavedTabs] = useState(() => {
    const saved = localStorage.getItem("savedTabs");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("tabData", JSON.stringify(tabData));
    localStorage.setItem("tabName", tabName);
    localStorage.setItem("savedTabs", JSON.stringify(savedTabs));
  }, [tabData, tabName, savedTabs]);

  const extractStringLabels = (content) => {
    const lines = content.split("\n").slice(0, instrument === "guitar" ? 6 : 4);
    return lines.map(line => line.split("-")[0]);
  };

  const addNewRow = () => {
    const labels = extractStringLabels(tabData[instrument].content);
    const newRow = "\n\n" + labels.map(label => `${label}${"-".repeat(isMobile ? 36 : 50)}`).join("\n");
    setTabData({
      ...tabData,
      [instrument]: {
        ...tabData[instrument],
        content: tabData[instrument].content + newRow,
      },
    });
  };

  const deleteLastRow = () => {
    const blocks = tabData[instrument].content.trim().split(/\n\s*\n/);
    if (blocks.length > 1) {
      blocks.pop();
      setTabData({
        ...tabData,
        [instrument]: {
          ...tabData[instrument],
          content: blocks.join("\n\n"),
        },
      });
    }
  };

  const handleTabChange = (e) => {
    setTabData({
      ...tabData,
      [instrument]: { ...tabData[instrument], content: e.target.value },
    });
  };

  const handleKeyDown = (e) => {
    const isEnter = e.key === "Enter";
    const isBackspace = e.key === "Backspace";

    if (!isMobile && isEnter && !e.shiftKey) {
      e.preventDefault();
      addNewRow();
    }

    if (isEnter && e.shiftKey) {
      return; // Allow shift+enter for line break
    }

    if (isBackspace && e.ctrlKey) {
      e.preventDefault();
      deleteLastRow();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tabData[instrument].content);
    alert("Copied to clipboard!");
  };

  const handleDownload = () => {
    const fileContent = `${tabName}\n\n${tabData.guitar.title}:\n${tabData.guitar.content}\n\n${tabData.bass.title}:\n${tabData.bass.content}`;
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tabName.replace(/\s+/g, "_")}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    const defaultRow = generateRow(instrument === "guitar" ? defaultGuitarStrings : defaultBassStrings);
    setTabData({
      ...tabData,
      [instrument]: {
        ...tabData[instrument],
        content: defaultRow,
      },
    });
  };

  const toggleInstrument = () => {
    setInstrument(instrument === "guitar" ? "bass" : "guitar");
  };

  const updateTitle = (e) => {
    setTabData({
      ...tabData,
      [instrument]: {
        ...tabData[instrument],
        title: e.target.value,
      },
    });
  };

  const saveCurrentTab = () => {
    const newSavedTabs = {
      ...savedTabs,
      [tabName]: { guitar: tabData.guitar, bass: tabData.bass },
    };
    setSavedTabs(newSavedTabs);
    alert("Tab saved!");
  };

  const loadTab = (name) => {
    const data = savedTabs[name];
    if (data) {
      setTabData(data);
      setTabName(name);
    }
  };

  const deleteTab = (name) => {
    const newTabs = { ...savedTabs };
    delete newTabs[name];
    setSavedTabs(newTabs);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Tabba</h1>

      <input
        type="text"
        value={tabName}
        onChange={(e) => setTabName(e.target.value)}
        placeholder="Tab Name"
        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", marginBottom: "1rem" }}
      />

      <button onClick={toggleInstrument} style={{ marginBottom: "1rem" }}>
        Switch to {instrument === "guitar" ? "Bass" : "Guitar"}
      </button>

      <input
        type="text"
        value={tabData[instrument].title}
        onChange={updateTitle}
        placeholder="Part Label (e.g. Clean Guitar)"
        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", marginBottom: "1rem" }}
      />

      <textarea
        value={tabData[instrument].content}
        onChange={handleTabChange}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          height: "400px",
          fontFamily: "monospace",
          fontSize: "0.9rem",
          padding: "1rem",
          whiteSpace: "pre",
        }}
        placeholder="Start writing your tab here..."
      />

      {isMobile ? (
        <>
          <button onClick={addNewRow} style={{ marginTop: "1rem" }}>+ Add Tab Row</button>
          <button onClick={deleteLastRow} style={{ marginTop: "1rem" }}>Delete Last Row</button>
        </>
      ) : (
        <>
          <button onClick={addNewRow} style={{ marginTop: "1rem", marginRight: "1rem" }}>+ Add Tab Row</button>
          <button onClick={deleteLastRow} style={{ marginTop: "1rem" }}>Delete Last Row</button>
        </>
      )}

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button onClick={handleClear}>Reset Tab</button>
        <button onClick={handleCopy}>Copy</button>
        <button onClick={handleDownload}>Download</button>
        <button onClick={saveCurrentTab}>Save Tab</button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Saved Tabs</h2>
        {Object.keys(savedTabs).length === 0 && <p>No saved tabs yet.</p>}
        <ul>
          {Object.keys(savedTabs).map((name) => (
            <li key={name} style={{ marginBottom: "0.5rem" }}>
              <strong>{name}</strong>
              <button onClick={() => loadTab(name)} style={{ marginLeft: "1rem" }}>Load</button>
              <button onClick={() => deleteTab(name)} style={{ marginLeft: "0.5rem", color: "red" }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {!isMobile && (
        <div style={{ marginTop: "2rem", backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "0.5rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Keyboard Shortcuts:</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: "1.6" }}>
            <li><strong>Enter</strong> – Add new tab row ({instrument === "guitar" ? 6 : 4} strings)</li>
            <li><strong>Shift + Enter</strong> – Manual line break</li>
            <li><strong>Ctrl + Backspace</strong> – Delete last tab row</li>
          </ul>
        </div>
      )}
    </div>
  );
}
