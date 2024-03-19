$(document).ready(function () {
    var imagePreview = $('#imagePreview');
    var img = null;
    
    $('#image').change(function () {
        var reader = new FileReader();
        reader.onload = function (e) {
            img = new Image();
            img.onload = function () {
                imagePreview.html('<img src="' + e.target.result + '" alt="Image preview" style="width: 100%; height: 100%; object-fit: contain;">');
            };
            img.src = e.target.result;
        }
        reader.readAsDataURL(this.files[0]);
    });
    
    imagePreview.on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css('background-color', 'rgb(55, 65, 81)');
    });
    
    imagePreview.on('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css('background-color', 'rgb(31, 41, 55)');
    });
    
    imagePreview.on('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).css('background-color', 'rgb(31, 41, 55)');
        
        var files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            $('#image').prop('files', files);
            var reader = new FileReader();
            reader.onload = function (e) {
                img = new Image();
                img.onload = function () {
                    imagePreview.html('<img src="' + e.target.result + '" alt="Image preview" style="width: 100%; height: 100%; object-fit: cover;">');
                };
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
    
    $('#splitButton').on('click', function () {
        if (img) {
            var tileSize = parseInt($('#tileSize').val());
            var tilesContainer = $('#tilesContainer');
            tilesContainer.empty();
            
            var hiddenCanvas = document.createElement('canvas');
            var hiddenCtx = hiddenCanvas.getContext('2d');
            
            hiddenCanvas.width = img.width;
            hiddenCanvas.height = img.height;
            
            hiddenCtx.drawImage(img, 0, 0, img.width, img.height);
            
            var rows = Math.ceil(img.height / tileSize);
            var cols = Math.ceil(img.width / tileSize);
            
            for (var i = 0; i < rows; i++) {
                for (var j = 0; j < cols; j++) {
                    var tileCanvas = document.createElement('canvas');
                    var tileCtx = tileCanvas.getContext('2d');
                    
                    var sourceX = j * tileSize;
                    var sourceY = i * tileSize;
                    var sourceWidth = Math.min(tileSize, img.width - sourceX);
                    var sourceHeight = Math.min(tileSize, img.height - sourceY);
                    
                    tileCanvas.width = sourceWidth;
                    tileCanvas.height = sourceHeight;
                    
                    tileCtx.drawImage(hiddenCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
                    
                    var tileImage = $('<img>').attr('src', tileCanvas.toDataURL());
                    var tileNumber = $('<div>').text('Tile ' + ((i * cols) + j + 1)).css({
                        'position': 'absolute',
                        'top': '50%',
                        'left': '50%',
                        'transform': 'translate(-50%, -50%)',
                        'text-align': 'center',
                        'font-size': '14px',
                        'color': 'white',
                        'text-shadow': '1px 1px 2px rgba(0, 0, 0, 0.8)'
                    });
                    
                    var tileWrapper = $('<div>').css({
                        'display': 'inline-block',
                        'margin': '5px',
                        'position': 'relative'
                    });
                    
                    tileWrapper.append(tileImage);
                    
                    tileImage.on('click', function () {
                        sendTileForAnalysis(this);
                    });
                    
                    tilesContainer.append(tileWrapper);
                }
            }
            
            imagePreview.html(tilesContainer);
            $('#analyzeButton').prop('disabled', false);
        }
    });
    
    
    
    $('#analyzeButton').on('click', function () {
        var tiles = $('#tilesContainer img');
        var index = 0;
        
        function analyzeTile() {
            if (index < tiles.length) {
                var tileImage = tiles[index];
                $(tileImage).addClass('analyzing');
                
                sendTileForAnalysis(tileImage, function (response) {
                    var resultItem = $('<div style="margin-bottom: 20px">').text('Tile ' + (index + 1) + ' Analysis Result: ' + response.completion);
                    $('#result').append(resultItem);

                    const term = document.getElementById("searchTerm").value;
                    if(term != "" && response.completion.includes(term)){
                        searchResult.innerHTML = `<h2>Found:<br> ${term}<h2>`
                        searchResult.innerHTML += '<img src="' + tileImage.src + '" alt="Found Image" style="max-width: 100%; height: auto;">';
                        document.getElementById("searchResult").style.display = "block";
                    }
                    
                    $(tileImage).removeClass('analyzing');
                    index++;
                    analyzeTile();
                });
            }
        }
        
        analyzeTile();
    });
    
    function sendTileForAnalysis(tileImage, callback) {
        var formData = new FormData();
        formData.append('image', dataURItoBlob(tileImage.src));
        formData.append('prompt', document.getElementById("prompt").value);
        formData.append('detail', document.getElementById("detail").value);
        
        $.ajax({
            type: 'POST',
            url: '/vision',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                callback(response);
            },
            error: function (error) {
                $(tileImage).removeClass('analyzing');
                $('#result').append('<p>Error</p>');
            }
        });
    }
    
    function dataURItoBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const searchResult = document.getElementById('searchResult');
    searchResult.addEventListener('click', function() {
        this.style.display = 'none';
    });
});