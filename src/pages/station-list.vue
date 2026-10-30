<template>
    <view>
        <scroll-view
            v-if="stationRes.length"
            class="line-map"
            scroll-x
            :show-scrollbar="false">
            <view class="line-map__track">
                <view
                    v-for="(item, index) in stationRes"
                    :key="item.title"
                    class="line-map__station"
                    :class="{
                        'line-map__station--active': index === 0,
                    }">
                    <view class="line-map__labels">
                        <text class="line-map__title">{{ item.title }}</text>
                        <text class="line-map__subtitle">
                            {{ item.subtitle }}
                        </text>
                    </view>
                    <view class="line-map__rail">
                        <view
                            v-if="index < stationRes.length - 1"
                            class="line-map__connector" />
                        <view class="line-map__dot" />
                    </view>
                </view>
            </view>
        </scroll-view>

        <uni-group
            v-for="item in stationRes"
            :key="item.title"
            :title="`${item.title} ${item.subtitle}`"
            class="station"
            mode="card">
            <view class="station-content">
                <!-- 判断是否需要添加“站” -->
                <view>{{ formatZhTitle(item.title) }}</view>
                <!-- 判断是否需要添加“Station” -->
                <view>{{ formatEnSubtitle(item.subtitle) }}</view>
                <view class="btnGroup">
                    <button @click="playSound(item.src)">播放</button>
                    <button class="stop-play" @click="stopPlay()">
                        停止播放
                    </button>
                </view>
            </view>
        </uni-group>
    </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { consumePagePostParams } from "@/utils/page-post-params";
import { fetchStationResource } from "@/utils/station-resource";
import { RESOURCE_BASE_URL, joinUrl } from "@/utils/env-config";

const PAGE_PATH = "/pages/station-list";
const DEFAULT_PARAMS = Object.freeze({
    line: "3b4",
    key1: "AirportNToPanyuSquare",
    key2: "AirportNStart",
    towards: "apn2pys",
});

// 页面参数通过入口页写入的“POST”缓存读取，缺失时回退默认值。
const pageParams = ref(consumePagePostParams(PAGE_PATH, DEFAULT_PARAMS));
const innerAudioContext = ref(null);
const stationRes = ref([]);

const formatZhTitle = (title) =>
    title.endsWith("站") ? title : `${title} 站`;

const formatEnSubtitle = (subtitle) =>
    subtitle.endsWith("Railway Station") ? subtitle : `${subtitle} Station`;

// 获取站点资源
const getStationRes = async () => {
    try {
        const { line, key1, key2, towards } = pageParams.value;
        stationRes.value = await fetchStationResource(
            joinUrl(RESOURCE_BASE_URL, `${line}-${towards}.json`),
            [key1, key2]
        );
    } catch (error) {
        console.error("Error fetching station resources:", error);
    }
};

// 播放音频
const playSound = (src) => {
    if (innerAudioContext.value) {
        innerAudioContext.value.pause();
        innerAudioContext.value.src = src;
        innerAudioContext.value.play();
    }
};

// 停止播放
const stopPlay = () => {
    if (innerAudioContext.value) {
        innerAudioContext.value.pause();
    }
};

// 初始化音频上下文
onMounted(() => {
    innerAudioContext.value = uni.createInnerAudioContext();
    getStationRes();
});

// 销毁音频上下文
onUnmounted(() => {
    if (innerAudioContext.value) {
        innerAudioContext.value.pause();
        innerAudioContext.value.destroy();
    }
});
</script>

<style>
.line-map {
    box-sizing: border-box;
    width: 100%;
    margin-bottom: 20rpx;
    padding: 28rpx 0 22rpx;
    background-color: #ffffff;
    border-bottom: 1rpx solid #e7ebf0;
    white-space: nowrap;
}

.line-map__track {
    display: inline-flex;
    box-sizing: border-box;
    min-width: 100%;
    padding: 0 32rpx;
}

.line-map__station {
    flex: 0 0 240rpx;
    width: 240rpx;
    color: #2c405a;
    text-align: center;
}

.line-map__labels {
    display: flex;
    height: 126rpx;
    padding: 0 12rpx 14rpx;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    box-sizing: border-box;
    white-space: normal;
}

.line-map__title,
.line-map__subtitle {
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
}

.line-map__title {
    font-size: 28rpx;
    font-weight: 600;
    line-height: 38rpx;
}

.line-map__subtitle {
    margin-top: 4rpx;
    color: #697386;
    font-size: 22rpx;
    line-height: 28rpx;
}

.line-map__rail {
    position: relative;
    display: flex;
    height: 32rpx;
    align-items: center;
    justify-content: center;
}

.line-map__connector {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    width: 100%;
    height: 6rpx;
    background-color: #cfd6df;
    transform: translateY(-50%);
}

.line-map__dot {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    width: 28rpx;
    height: 28rpx;
    background-color: #ffffff;
    border: 6rpx solid #8692a6;
    border-radius: 50%;
}

.line-map__station--active .line-map__title,
.line-map__station--active .line-map__subtitle {
    color: #007aff;
}

.line-map__station--active .line-map__dot {
    background-color: #007aff;
    border-color: #007aff;
    box-shadow: 0 0 0 8rpx #e5f1ff;
}

.station-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.btnGroup {
    display: flex;
    justify-content: center;
    gap: 20rpx;
    margin-top: 20rpx;
}

button {
    width: 200rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}

.station {
    width: auto;
}
</style>
