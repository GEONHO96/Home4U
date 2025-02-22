package com.piko.home4u.model;

public enum RoomStructure {
    OPEN_TYPE,        // 오픈형 원룸 (구분 없이 하나의 공간)
    SEPARATE_TYPE,    // 분리형 원룸 (방과 거실이 분리됨)
    TWO_ROOM,         // 투룸 (방 2개)
    THREE_ROOM,       // 쓰리룸 이상 (방 3개 이상)
    DUPLEX            // 복층 (층이 나뉜 구조)
}
