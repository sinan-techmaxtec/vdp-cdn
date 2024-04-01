const template = document.createElement("template");
template.innerHTML = `
<div class="h-screen w-screen">
    <div class="loading-overlay" style="display: none;">
        <div class="w-full h-full flex justify-center items-center">
            <img class="loading-icon" src="loading.gif" alt="Loading...">
        </div>
    </div>
    <div class="error-overlay" style="display: none;">
        <div class="w-full h-full flex justify-center items-start px-4">
            <div class="error-message"></div>
        </div>
    </div>
    <div class="gallery-content">
        <div class="gallery-display">
            <div class="asset-display">
                <img class="asset-image" alt="Asset">
                <video class="asset-video" controls></video>
            </div>
        </div>
        <div class="asset-thumbnails">
        </div>
    </div>
</div>

<style>
.h-screen{
    height:100vh;
}

.w-screen{
    width:100vw;
}

.min-h-full {
    min-height: 100%;
}

.min-w-full {
    min-width: 100%;
}

.w-full {
    width: 100%;
}

.h-full {
    height: 100%;
}

.flex {
    display: flex;
}

.justify-center {
    justify-content: center;
}

.items-center {
    align-items: center;
}

.px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
}

.overflow-x-auto {
    overflow-x: auto;
}

.gap-4 {
    gap: 1rem;
}

.bg-darker-grey {
    background-color: #333;
}

.relative {
    position: relative;
}

.min-w-60 {
    min-width: 60px;
}

.max-w-60 {
    max-width: 60px;
}

.object-contain {
    object-fit: contain;
}

.rounded {
    border-radius: 0.25rem;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 999;
}

.error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(255, 0, 0, 0.8);
    z-index: 999;
    color: #fff;
}

.error-message {
    padding: 1rem;
}

.asset-thumbnails{
    display:flex;
    gap:4px;
}

.asset-thumbnails img{
    width:100px;
    object-fit:contain;
}

.asset-image{
    width:500px
}

.asset-video{
    width:500px
}
</style>
`;

class VehicleDisplayComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.isLoading = true;
    this.error = {
      isError: false,
      errorMessage: "",
    };
    this.vehicleAssets = [];
    this.activeAsset = {};
    this.vehicleId = null;
  }

  connectedCallback() {
    this.vehicleId = this.getAttribute("vehicle-id");
    this.fetchVehicleAssets(1);
  }

  disconnectedCallback() {
    video.removeEventListener("play", () => {
      console.log("play");
    });
  }

  async fetchVehicleAssets(vehicleId) {
    this.error.isError = false;
    this.isLoading = true;
    try {
      const res = await axios.get(
        "https://localhost:7152/api/v1/MerchAppReporting/GetVehicleAssets",
        {
          params: { vehicleId: vehicleId },
        }
      );
      this.vehicleAssets = this.concatAssets(
        res.data.response.imageUrls,
        res.data.response.mediaUrls,
        res.data.response.autoClipUrls
      );
      this.activeAsset = this.vehicleAssets[0];
      this.renderGallery();
      this.isLoading = false;
    } catch (err) {
      console.log(err);
      this.isLoading = false;
      this.error.isError = true;
      //   if (err.response.data.statusCode === 400) {
      //     this.error.errorMessage = "No asset found";
      //   } else {
      //     this.error.errorMessage =
      //       "Unable to fetch vehicle assets. Please try again";
      //   }
      this.renderError();
    }
  }

  concatAssets(imageUrls, mediaUrls, autoclipUrls) {
    const imageUrlsWithType = imageUrls.map((imageUrl) => {
      return {
        ...imageUrl,
        type: "image",
      };
    });
    const mediaUrlsWithType = mediaUrls.map((mediaUrl) => {
      return {
        ...mediaUrl,
        type: "video",
      };
    });
    const autoclipUrlsWithType = autoclipUrls.map((autoclipUrl) => {
      return {
        ...autoclipUrl,
        type: "video",
      };
    });
    const sortedAutoclipUrls = autoclipUrlsWithType.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const mergedImageAndVideos = imageUrlsWithType.concat(mediaUrlsWithType);
    const sortedMergedImageAndVideos = mergedImageAndVideos.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    return sortedAutoclipUrls.concat(sortedMergedImageAndVideos);
  }

  renderGallery() {
    const galleryDisplay = this.shadowRoot.querySelector(".gallery-display");
    const assetThumbnails = this.shadowRoot.querySelector(".asset-thumbnails");
    galleryDisplay.innerHTML = "";
    assetThumbnails.innerHTML = "";

    const assetContainer = document.createElement("div");
    assetContainer.classList.add("asset-container");

    if (this.activeAsset.type === "image") {
      const img = document.createElement("img");
      img.classList.add("asset-image");
      img.src = this.activeAsset.url;
      img.alt = "Image";
      assetContainer.appendChild(img);
    } else if (this.activeAsset.type === "video") {
      const video = document.createElement("video");
      video.classList.add("asset-video");
      video.src = this.activeAsset.url;
      video.controls = true;
      assetContainer.appendChild(video);

      video.addEventListener("play", () => {
        console.log("play");
      });
    }

    this.vehicleAssets.forEach((asset) => {
      const thumbnail = document.createElement("img");
      thumbnail.classList.add("thumbnail");
      if (asset.type === "video") {
        thumbnail.src = "./dummy-player.png";
      } else {
        thumbnail.src = asset.url;
      }
      thumbnail.onclick = () => {
        console.log("New active asset");
        this.activeAsset = asset;
        this.renderGallery();
      };

      if (this.activeAsset.url === asset.url) {
        thumbnail.classList.add("active");
      }

      assetThumbnails.appendChild(thumbnail);
      galleryDisplay.appendChild(assetContainer);
    });
  }

  renderError() {
    const errorMessageElement = this.shadowRoot.querySelector(".error-message");
    errorMessageElement.textContent = this.error.errorMessage;

    const errorOverlay = this.shadowRoot.querySelector(".error-overlay");
    errorOverlay.style.display = "flex";
  }
}

window.customElements.define(
  "vehicle-display-component",
  VehicleDisplayComponent
);
