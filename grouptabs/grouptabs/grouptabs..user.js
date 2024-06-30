// ==UserScript==
// @name              Grouptabs
// @author            Thejesh GN
// @description       This script downloads the group as CSV. Groutabs uses CouchDB backend. It sets up a seaparate database per group. We will use the CouchDB web APIs to access `_all_docs` and save it as CSV.
// @description       https://thejeshgn.com
// @version           0.1
// @match https://app.grouptabs.net/*
// @grant GM_addStyle
// @grant GM.xmlHttpRequest
// @grant GM.registerMenuCommand
// @grant GM.notification
// @icon https://app.grouptabs.net/favicon.ico
// ==/UserScript==

// Function to download data as a file
function download(data, filename, type) {
    var file = new Blob([data], { type: type });
    var a = document.createElement("a"),
        url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function getParticipantColumns(rows) {
    const participantColumns = new Set();
    rows.forEach(row => {
        row.doc.participants.forEach(p => participantColumns.add(p.participant));
    });
    return Array.from(participantColumns);
}

function getParticipantsData(participants, participantColumns) {
    const participantData = {};
    participantColumns.forEach(col => {
        participantData[col] = 0; // Initialize all columns with 0
    });
    participants.forEach(p => {
        if (participantData.hasOwnProperty(p.participant)) {
            participantData[p.participant] = p.amount;
        }
    });
    return participantColumns.map(col => participantData[col]);
}

function jsonToCsv(rows) {
      // Filter only "transaction" objects
      rows = rows.filter(row => row.doc.type === "transaction");

      // Extract columns from the first row
      const columns = ["_id", "type", "timestamp", "transactionType", "description", "date"];
      const csvRows = [];

      const participantColumns = getParticipantColumns(rows);

      // Add header
      columns.push(...participantColumns);
      csvRows.push(columns.join(","));

      // Add rows
      rows.forEach(row => {
          const doc = row.doc;
          const participantsData = getParticipantsData(doc.participants, participantColumns);
          const values = [
              doc._id,
              doc.type,
              doc.timestamp,
              doc.transactionType,
              doc.description,
              doc.date,
              ...participantsData
          ];
          csvRows.push(values.join(","));
      });

      return csvRows.join("\n");
}

function grouptabs() {
//    GM.notification("grouptabs", "start");
    var url = document.URL;
    var extractedValue = url.split('/').pop();
//    GM.notification("grouptabs",extractedValue);
    var db_path ="https://backend.grouptabs.net/tab%2F"+extractedValue+"/_all_docs?include_docs=true"
    var csv_file = extractedValue +".csv"
    var xhr = new XMLHttpRequest();
    xhr.open("GET",db_path, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonResponse = JSON.parse(xhr.responseText);
            var csvData = jsonToCsv(jsonResponse.rows);
            download(csvData,csv_file, "text/csv");
        }
    };
    xhr.send();
}


GM.registerMenuCommand("Export as CSV", grouptabs,  { title: 'Export as CSV' });
