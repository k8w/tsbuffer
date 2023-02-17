interface Protocol<Req, Res> {
    req?: Req,
    res?: Res,
    url: string,
    conf?: object
}

interface ReqTest {
    test: string;
}

interface ResTest {
    test1: boolean;
}

const PtlTest: Protocol<ReqTest, ResTest> = {
    url: 'xxxkjj',
    conf: {
        needLogin: true
    }
};

function callApi<P extends Protocol<any, any>>(ptl: P, req: P['req']): P['res'] {
    throw new Error('e')
}

export default interface MsgXXX {
}

// function sendMsg(msg: MsgXXX);

callApi(PtlTest, {
    test: 'xxx'
})
