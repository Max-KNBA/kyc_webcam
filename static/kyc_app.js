const video = document.getElementById('webcam'); // 获取视频元素
const images = []; // 存储捕获的图像信息

async function initWebcam() {
    console.log("Initializing webcam...");
    try {
        const constraints = {
            video: {
                width: { ideal: 1920 }, // 设置理想宽度
                height: { ideal: 1080 }, // 设置理想高度
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints); // 请求用户媒体设备权限
        video.srcObject = stream; // 将视频流设置为视频元素的源
        console.log("Webcam stream started.");

        // 检查是否支持自动对焦
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.focusMode) {
            console.log('Autofocus is supported:', capabilities.focusMode);
        } else {
            console.log('Autofocus is not supported on this device.');
        }

    } catch (err) {
        console.error("Error accessing webcam: ", err); // 捕获错误并输出
    }
}

async function capture(docId) {
    const canvas = document.createElement('canvas'); // 创建画布元素
    canvas.width = video.videoHeight; // 交换宽度和高度以进行旋转
    canvas.height = video.videoWidth;
    const context = canvas.getContext('2d');

    // 将画布中心移动到中心点并旋转90度
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(Math.PI / 2);

    // 绘制视频帧，调整位置以适应旋转
    context.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight);

    const container = document.createElement('div'); // 创建容器元素
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';

    const checkbox = document.createElement('input'); // 创建复选框
    checkbox.type = 'checkbox';

    canvas.addEventListener('click', () => {
        const image = images.find(img => img.canvas === canvas);
        image.selected = !image.selected; // 切换选中状态
        checkbox.checked = image.selected;
    });

    container.appendChild(canvas); // 将画布添加到容器
    container.appendChild(checkbox); // 将复选框添加到容器
    document.querySelector(`#${docId} .doc-content`).appendChild(container); // 将容器添加到文档内容区域

    // 使用JPEG格式压缩图像并设置质量
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    images.push({ docId, dataUrl, selected: false, canvas, checkbox }); // 将图像信息存储到数组
}

async function upload() {
    const selectedImages = images.filter(image => image.selected); // 筛选选中的图像
    if (selectedImages.length > 0) {
        alert('Uploading selected documents...');
        const uploadPromises = selectedImages.map((image, index) => {
            const blob = dataURLToBlob(image.dataUrl); // 将数据URL转换为Blob
            const fileName = `${image.docId}_${index + 1}.png`; // 使用 docId_加上序号作为文件名
            const formData = new FormData();
            formData.append(`file`, blob, fileName); // 将Blob添加到FormData

            // Return a promise for each upload
            return fetch('/upload', { // 修改为本机的 /upload 路径
                method: 'POST',
                body: formData
            }).then(response => response.json());
        });

        try {
            const results = await Promise.all(uploadPromises); // Use Promise.all for parallel uploads
            console.log('Success:', results);
            alert('Upload successful!');
        } catch (error) {
            console.error('Error:', error);
            alert('Upload failed.');
        }
    } else {
        alert('No documents selected for upload.');
    }
}

function dataURLToBlob(dataUrl) {
    const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime}); // 将数据URL转换为Blob对象
}

initWebcam(); // 初始化摄像头

// 可选：添加触摸事件处理
const docContents = document.querySelectorAll('.doc-content');

docContents.forEach(docContent => {
    let isDown = false;
    let startX;
    let scrollLeft;

    docContent.addEventListener('mousedown', (e) => {
        isDown = true;
        docContent.classList.add('active');
        startX = e.pageX - docContent.offsetLeft;
        scrollLeft = docContent.scrollLeft;
    });

    docContent.addEventListener('mouseleave', () => {
        isDown = false;
        docContent.classList.remove('active');
    });

    docContent.addEventListener('mouseup', () => {
        isDown = false;
        docContent.classList.remove('active');
    });

    docContent.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - docContent.offsetLeft;
        const walk = (x - startX) * 3; // 快速滚动
        docContent.scrollLeft = scrollLeft - walk;
    });
});
