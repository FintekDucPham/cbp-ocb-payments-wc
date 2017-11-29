
    var oFileIn = document.getElementById('my_file_input');
    if(oFileIn != null && oFileIn.addEventListener) {
        oFileIn.addEventListener('change', filePicked, false);
    }


function filePicked(oEvent) {
    // Get The File From The Input
    var oFile = oEvent.target.files[0];
    var sFilename = oFile.name;
    // Create A File Reader HTML5
    var reader = new FileReader();

	var tempArray = sFilename.split(".");
	var ext = tempArray[tempArray.length -1];
	console.log(ext);
    // Ready The Event For When A File Gets Selected
	
	var script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	
	
    reader.onload = function(e) {
        var data = e.target.result;
		var readerObj = null;
		if(ext === 'xls') {
			script.setAttribute("src", "xls.js");
			readerObj = XLS;
		}
		if(ext === 'xlsx') {
			script.setAttribute("src", "xlsx.js");
			readerObj = XLSX;
		}
		document.getElementsByTagName("head")[0].appendChild(script);
		
		readExcelFile(data, readerObj);
        document.getElementsByTagName("head")[0].removeChild(script);
    };

	function readExcelFile(data, excelObject) {
        var cfb = excelObject.CFB.read(data, {type: 'binary'});
        var wb = excelObject.parse_xlscfb(cfb);
        // Loop Over Each Sheet
        wb.SheetNames.forEach(function(sheetName) {
            // Obtain The Current Row As CSV
            var sCSV = excelObject.utils.make_csv(wb.Sheets[sheetName]);   
            var oJS = excelObject.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);   
			var my_file_output = document.getElementById('my_file_input');

            my_file_output.innerHTML =sCSV;
            console.log(oJS)
        });
	}
	

    // Tell JS To Start Reading The File.. You could delay this if desired
    reader.readAsBinaryString(oFile);
}