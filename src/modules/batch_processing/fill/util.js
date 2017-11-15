
    // var oFileIn = document.getElementById('my_file_input');
    // console.log(oFileIn);
    // if(oFileIn.addEventListener) {
    //     oFileIn.addEventListener('change', filePicked, false);
    // }
function tienTest_(){
	console.log("zzzzzzz");
}
function filePicked(file) {
    // Get The File From The Input
    var sFilename = file.name;
    // Create A File Reader HTML5
    var reader = new FileReader();

	var tempArray = sFilename.split(".");
	var ext = tempArray[tempArray.length -1];
    // Ready The Event For When A File Gets Selected

    reader.onload = function(e) {
        var data = e.target.result;
        var readerObj = null;
        if(ext === 'xls') {
            readerObj = XLS;
        }
        if(ext === 'xlsx') {
            readerObj = XLSX;
        }
        return readExcelFile(data, readerObj);
    };

    // Tell JS To Start Reading The File.. You could delay this if desired
    reader.readAsBinaryString(file);
}

function readExcelFile(data, excelObject) {
    var cfb = excelObject.CFB.read(data, {type: 'binary'});
    var wb = excelObject.parse_xlscfb(cfb);
    // Loop Over Each Sheet
    var sCSV = null;
    var oJS = null;
    wb.SheetNames.forEach(function(sheetName) {
        // Obtain The Current Row As CSV
        sCSV = excelObject.utils.make_csv(wb.Sheets[sheetName]);
        oJS = excelObject.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);

    });
    return oJS;
}